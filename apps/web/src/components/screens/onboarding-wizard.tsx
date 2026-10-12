"use client";

// Ported from the "farmer_first_farm_onboarding_wizard_cultivanode" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { useState } from "react";
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogClose, showScreenToast } from "@/components/ds/screen-dialog";
import { downloadFile } from "@/lib/download";
import type { ScreenProps } from "./types";

interface CropOption {
  id: string;
  name: string;
  variety: string;
}

const AVAILABLE_CROPS: CropOption[] = [
  { id: "maize", name: "Maize", variety: "SAMMAZ-15" },
  { id: "cassava", name: "Cassava", variety: "TME-419" },
  { id: "rice", name: "Faro-44 Lowland Rice", variety: "Faro-44" },
  { id: "cowpea", name: "Cowpea (Brown beans)", variety: "SAMPEA-14" },
  { id: "yam", name: "Yam", variety: "Asiedu / White" },
  { id: "pepper", name: "Tatashe & Rodo Pepper", variety: "Ughelli" },
  { id: "tomato", name: "Tomato", variety: "UTC / Tropimech" },
  { id: "okra", name: "Okra", variety: "Clemson Spineless" },
];

export function OnboardingWizard(_props: ScreenProps) {
  const [tenureDocUploaded, setTenureDocUploaded] = useState(false);
  const [tenureType, setTenureType] = useState("communal");
  const [farmName, setFarmName] = useState("Oluwaseun Agro-Ventures Cluster Node");
  const [unit, setUnit] = useState<"ha" | "ac">("ha");
  const [farmSize, setFarmSize] = useState("12.4");
  const [boundarySource, setBoundarySource] = useState<"pin" | "mobile" | "survey">("pin");
  const [selectedCrops, setSelectedCrops] = useState<string[]>(["maize", "cassava"]);

  const toggleCrop = (cropId: string) => {
    setSelectedCrops((prev) => {
      const exists = prev.includes(cropId);
      if (exists) {
        if (prev.length === 1) {
          showScreenToast("Please keep at least one primary crop stand selected.");
          return prev;
        }
        return prev.filter((id) => id !== cropId);
      }
      return [...prev, cropId];
    });
  };

  const handleUnitChange = (newUnit: "ha" | "ac") => {
    if (newUnit === unit) return;
    setUnit(newUnit);
    const num = parseFloat(farmSize) || 0;
    if (newUnit === "ac") {
      setFarmSize((num * 2.47105).toFixed(1));
      showScreenToast("Acreage unit updated to Acres.");
    } else {
      setFarmSize((num / 2.47105).toFixed(1));
      showScreenToast("Acreage unit updated to Hectares (Ha).");
    }
  };

  const handleSaveDraft = () => {
    const draftPayload = {
      farmName,
      tenureType,
      tenureDocUploaded,
      size: `${farmSize} ${unit.toUpperCase()}`,
      boundarySource,
      crops: selectedCrops,
      coordinates: "8.2140° N, 3.5820° E",
      state: "Oyo",
      lga: "Iseyin",
      savedAt: new Date().toISOString(),
    };
    downloadFile("cultivanode-onboarding-draft.json", JSON.stringify(draftPayload, null, 2), "application/json");
    showScreenToast("Registration draft saved! PostGIS polygon specs cached to local SQLite.");
  };

  const handleDownloadCertificate = () => {
    const certText = `================================================================================
CULTIVANODE AGRARIAN HOLDING CERTIFICATE (PROVISIONAL)
Federal Republic of Nigeria · Cadastral Agricultural Registry
Doc Ref: CN-NG-OYO-${Date.now().toString().slice(-6)}
================================================================================

1. HOLDING IDENTIFICATION
- Farm Enterprise: ${farmName}
- Lead Farmer / Custodian: Adebayo K. Alabi (NIN Verified: 3829****712)
- State & LGA: Oyo State · Iseyin Local Government Area
- Agro-Ecological Zone: Derived Savanna (Bimodal Rainfed Basin)
- Cadastral Landmark: Oke-Ogun Savanna Basin Cluster #04

2. GEOMETRY & TENURE
- Declared Area: ${farmSize} ${unit === "ha" ? "Hectares" : "Acres"} (1,780m Perimeter)
- PostGIS Anchor: 8.2140° N, 3.5820° E
- Land Holding Class: ${tenureType.toUpperCase()}
- Tenure Verification: ${tenureDocUploaded ? "VERIFIED DOCUMENT ON FILE" : "SELF-DECLARED PROVISIONAL"}
- Soil Classification: Ferric Luvisols (2.4% Gentle Basin Slope)

3. CROP ALLOCATION & SYNDICATE ALLIANCE
- Primary Crops: ${selectedCrops.map((c) => c.toUpperCase()).join(", ")}
- Operational Season: Early Season 2026 Onset
- Assigned ADP Extension Hub: Engr. Babatunde Ogunlesi · Oyo State ADP
- Escrow Guarantee: Supported by CultivaNode Multi-Stakeholder Risk Pool

ISSUED UNDER NIGERIA DATA PROTECTION ACT (NDPA 2023)
================================================================================`;
    downloadFile("cultivanode-farm-holding-certificate.md", certText, "text/markdown");
    showScreenToast("Provisional Farm Certificate downloaded!");
  };

  const modalUploadDeed = (
    <div className="bg-surface-container-lowest max-w-xl w-full rounded-xl shadow-xl overflow-hidden flex flex-col">
      <div className="p-space-lg bg-surface-container-lowest flex items-center justify-between border-b border-surface-container-high">
        <div className="flex items-center gap-space-xs">
          <Icon name="upload_file" className="text-primary text-2xl" />
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Upload Land Tenure Evidence</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Baale Consent, Customary Deed, C-of-O or Leasehold</p>
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
          setTenureDocUploaded(true);
          showScreenToast("Tenure deed uploaded and indexed to PostGIS Cadastral Registry!");
        }}
        className="p-space-lg space-y-space-md text-left"
      >
        <div className="space-y-space-xs">
          <label className="font-label-md text-label-md text-on-surface font-semibold">Document Classification</label>
          <select className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none">
            <option>Baale / Traditional Ruler Consent Letter</option>
            <option>Statutory Certificate of Occupancy (C-of-O)</option>
            <option>Governor's Consent / Registered Deed of Conveyance</option>
            <option>Family Land Allocation Receipt & Witness Statement</option>
            <option>Long-term Agricultural Lease Agreement (&gt;5 Years)</option>
          </select>
        </div>
        <div className="space-y-space-xs">
          <label className="font-label-md text-label-md text-on-surface font-semibold">Grantor / Traditional Custodian Name</label>
          <input defaultValue="Chief Adewale Adeleke (Baale of Iseyin Central)" className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none" type="text" />
        </div>
        <div className="p-space-md rounded-lg border-2 border-dashed border-primary/40 bg-primary-container/10 flex flex-col items-center justify-center text-center gap-1 cursor-pointer hover:bg-primary-container/20 transition-colors">
          <Icon name="cloud_upload" className="text-3xl text-primary" />
          <p className="font-label-md text-label-md text-on-surface font-semibold">Drop PDF scan or photo of deed document</p>
          <span className="font-body-sm text-body-sm text-on-surface-variant">Accepted: PDF, JPG, PNG (Max 15MB)</span>
        </div>
        <div className="pt-space-md flex items-center justify-end gap-space-sm border-t border-surface-container-high">
          <ScreenDialogClose>
            <button onClick={() => {}} className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md" type="button">
              Cancel
            </button>
          </ScreenDialogClose>
          <ScreenDialogClose>
            <button onClick={() => {}} className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold" type="submit">
              Upload &amp; Verify Document
            </button>
          </ScreenDialogClose>
        </div>
      </form>
    </div>
  );

  const modalCompleteSetup = (
    <div className="bg-surface-container-lowest max-w-xl w-full rounded-xl shadow-xl overflow-hidden flex flex-col">
      <div className="p-space-lg bg-surface-container-lowest flex items-center justify-between border-b border-surface-container-high">
        <div className="flex items-center gap-space-xs">
          <Icon name="task_alt" className="text-secondary text-2xl" />
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Confirm Holding &amp; Launch</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Synchronizing PostGIS Cadastral Layer</p>
          </div>
        </div>
        <ScreenDialogClose>
          <button onClick={() => {}} className="p-1 text-on-surface-variant hover:text-on-surface" type="button">
            <Icon name="close" />
          </button>
        </ScreenDialogClose>
      </div>
      <div className="p-space-lg space-y-space-md text-left">
        <div className="p-space-sm bg-surface-container-low rounded-lg space-y-2">
          <div className="flex justify-between font-label-md text-label-md">
            <span className="text-on-surface-variant">Farm Holding:</span>
            <span className="font-bold text-on-surface">{farmName}</span>
          </div>
          <div className="flex justify-between font-label-md text-label-md">
            <span className="text-on-surface-variant">Declared Extent:</span>
            <span className="font-bold text-primary">{farmSize} {unit.toUpperCase()} (1,780m Perimeter)</span>
          </div>
          <div className="flex justify-between font-label-md text-label-md">
            <span className="text-on-surface-variant">Selected Crops:</span>
            <span className="font-bold text-on-surface">{selectedCrops.join(", ")}</span>
          </div>
          <div className="flex justify-between font-label-md text-label-md">
            <span className="text-on-surface-variant">Assigned Extension:</span>
            <span className="font-bold text-secondary">Engr. Babatunde Ogunlesi · Oyo ADP</span>
          </div>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Completing registration provisions your farm workspace, enables real-time weather alerts via NiMet radar, and links your parcel to the Oke-Ogun Machinery Syndicate.
        </p>
        <div className="pt-space-md flex items-center justify-between gap-space-sm border-t border-surface-container-high">
          <button
            onClick={handleDownloadCertificate}
            className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors flex items-center gap-1.5"
            type="button"
          >
            <Icon name="download" className="text-base" /> Download Certificate
          </button>
          <div className="flex items-center gap-space-sm">
            <ScreenDialogClose>
              <button onClick={() => {}} className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md" type="button">
                Review Again
              </button>
            </ScreenDialogClose>
            <ScreenDialogClose>
              <button
                onClick={() => showScreenToast("Farm holding initialized successfully! Welcome to CultivaNode.")}
                className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold"
                type="button"
              >
                Launch Dashboard
              </button>
            </ScreenDialogClose>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="screen flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.035] bg-[radial-gradient(#003620_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="relative z-10 w-full max-w-7xl mx-auto px-margin-tablet lg:px-margin-desktop py-space-xl flex flex-col items-center justify-center">
        <div className="flex flex-col w-full">
          <div className="w-full bg-surface-container-lowest rounded-xl shadow-sm p-space-md lg:p-space-lg mb-space-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mb-space-lg">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-sm text-label-sm uppercase text-secondary font-bold tracking-wider">Agrarian Enterprise Gateway</span>
                  <span className="text-outline-variant">•</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Doc 2 (§5.3 / §8.1) Synchronized</span>
                </div>
                <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">Onboard Farmer &amp; Register Primary Field Holding</h1>
              </div>
              <div className="flex items-center gap-space-sm bg-surface-container-low px-space-md py-space-sm rounded-lg self-start lg:self-auto">
                <div className="flex flex-col text-right">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Validated Agrarian Identity</span>
                  <span className="font-label-md text-label-md text-on-surface font-bold">Adebayo K. Alabi · NIN Verified</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                  <Icon name="verified" className="text-[18px]" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-space-sm relative mb-space-lg">
              <div className="flex items-center gap-space-sm bg-surface-container-low/60 p-space-sm rounded-lg">
                <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center flex-shrink-0">
                  <Icon name="check" className="text-[18px]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Step 1</span>
                  <span className="font-label-md text-label-md text-on-surface font-semibold truncate">Identity &amp; NIN</span>
                </div>
              </div>
              <div className="flex items-center gap-space-sm bg-primary-container p-space-sm rounded-lg shadow-sm">
                <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center flex-shrink-0 font-bold font-label-md text-label-md">2</div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-sm text-label-sm text-on-primary-container uppercase tracking-wider">Step 2 · In Progress</span>
                  <span className="font-label-md text-label-md text-on-primary font-bold truncate">First Farm Setup</span>
                </div>
              </div>
              <div className="flex items-center gap-space-sm bg-surface-container-low/40 p-space-sm rounded-lg opacity-70">
                <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant flex-shrink-0 font-bold font-label-md text-label-md">3</div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Step 3</span>
                  <span className="font-label-md text-label-md text-on-surface-variant truncate">Crop Plan &amp; Varieties</span>
                </div>
              </div>
              <div className="flex items-center gap-space-sm bg-surface-container-low/40 p-space-sm rounded-lg opacity-70">
                <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant flex-shrink-0 font-bold font-label-md text-label-md">4</div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Step 4</span>
                  <span className="font-label-md text-label-md text-on-surface-variant truncate">Review &amp; Ready</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                <span className="font-semibold text-primary flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-secondary animate-pulse" /> 65% Complete · Basic setup takes under 3 minutes</span>
                <span className="text-on-surface-variant hidden sm:inline">Automatic GeoJSON Geometry Compilation Enabled</span>
              </div>
              <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[65%] rounded-full transition-all duration-500 ease-out" />
              </div>
            </div>
            <div className="mt-space-md p-space-sm bg-surface-container-low rounded-lg flex items-center gap-space-sm">
              <Icon name="cloud_done" className="text-secondary text-[20px] flex-shrink-0" />
              <p className="font-body-sm text-body-sm text-on-surface leading-tight"><strong className="font-semibold text-primary">Progress is saved automatically.</strong> You can start managing farm operations immediately and refine exact PostGIS polygon vertices or schedule soil lab verification later.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
            <div className="lg:col-span-7 flex flex-col gap-space-lg">
              <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md lg:p-space-lg flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="domain" className="text-primary text-[22px]" />
                    <h2 className="font-headline-md text-headline-md text-on-surface">1. Farm Identity &amp; Cadastral Tenure</h2>
                  </div>
                  <span className="font-label-sm text-label-sm bg-surface-container px-space-sm py-0.5 rounded-full text-on-surface-variant">M1-Registry</span>
                </div>
                <div className="flex flex-col gap-space-sm">
                  <label className="font-label-md text-label-md text-on-surface-variant font-semibold" htmlFor="farm-name">Registered Farm or Holding Enterprise Name</label>
                  <div className="relative">
                    <input
                      className="w-full h-10 px-space-md bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      id="farm-name"
                      placeholder="e.g. Oluwaseun Agro-Ventures"
                      type="text"
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                  <div className="flex flex-col gap-space-sm">
                    <label className="font-label-md text-label-md text-on-surface-variant font-semibold" htmlFor="tenure-status">Tenure &amp; Land Holding Class</label>
                    <select
                      value={tenureType}
                      onChange={(e) => setTenureType(e.target.value)}
                      className="w-full h-10 px-space-md bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      id="tenure-status"
                    >
                      <option value="freehold">Owned / Freehold Deed</option>
                      <option value="communal">Family Land / Communal Title</option>
                      <option value="lease">Long-term Lease (&gt;5 Years)</option>
                      <option value="sharecropping">Sharecropping / Tenant Holding</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-space-sm">
                    <label className="font-label-md text-label-md text-on-surface-variant font-semibold">Tenure Verification Evidence</label>
                    <ScreenDialog title="Upload Deed / Consent" side="center" panel={modalUploadDeed}>
                      <button onClick={() => {}} className={`w-full h-10 px-space-md rounded-lg flex items-center justify-center gap-2 transition-colors font-label-md text-label-md ${
                        tenureDocUploaded ? "bg-secondary-container text-on-secondary-container font-semibold" : "bg-surface-container-low hover:bg-surface-container text-primary"
                      }`} type="button">
                        <Icon name={tenureDocUploaded ? "check_circle" : "upload_file"} className="text-[18px]" />
                        <span>{tenureDocUploaded ? "Document Verified (C-of-O)" : "Upload Deed / Baale Consent"}</span>
                      </button>
                    </ScreenDialog>
                  </div>
                </div>
                <div className="flex flex-col gap-space-sm mt-space-xs">
                  <span className="font-label-md text-label-md text-on-surface-variant font-semibold">Agro-Ecological Classification (SW Nigeria Agronomy)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                    <label className="flex flex-col p-space-sm rounded-lg bg-surface-container cursor-pointer transition-all hover:bg-surface-container-high relative">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-headline-sm text-headline-sm text-primary font-bold">Derived Savanna</span>
                        <input defaultChecked className="accent-primary" name="agro-zone" type="radio" value="savanna" />
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Oyo, Northern Ogun, Ekiti · Bimodal savanna planting calendar (Savanna rain onset April-May)</span>
                    </label>
                    <label className="flex flex-col p-space-sm rounded-lg bg-surface-container-low cursor-pointer transition-all hover:bg-surface-container-high relative">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Rainforest Belt</span>
                        <input className="accent-primary" name="agro-zone" type="radio" value="rainforest" />
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Southern Osun, Ondo, Lagos, Ogun · High precipitation belt (Onset March-April)</span>
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
                  <div className="flex flex-col gap-space-xs">
                    <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">Federated State</label>
                    <select defaultValue="oyo" className="w-full h-10 px-3 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="oyo">Oyo State</option>
                      <option value="ogun">Ogun State</option>
                      <option value="osun">Osun State</option>
                      <option value="ondo">Ondo State</option>
                      <option value="ekiti">Ekiti State</option>
                      <option value="lagos">Lagos State</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-space-xs">
                    <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">LGA Territory</label>
                    <select defaultValue="iseyin" className="w-full h-10 px-3 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="iseyin">Iseyin</option>
                      <option value="saki-west">Saki West</option>
                      <option value="saki-east">Saki East</option>
                      <option value="ogbomoso">Ogbomoso North</option>
                      <option value="odeda">Odeda</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-space-xs">
                    <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">Nearest Landmark Hub</label>
                    <input className="w-full h-10 px-3 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-sm" type="text" defaultValue="Oke-Ogun Savanna Basin Cluster #04" />
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md lg:p-space-lg flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="polyline" className="text-primary text-[22px]" />
                    <h2 className="font-headline-md text-headline-md text-on-surface">2. Field Delineation &amp; Geolocation</h2>
                  </div>
                  <span className="font-label-sm text-label-sm bg-surface-container px-space-sm py-0.5 rounded-full text-on-surface-variant">PostGIS Telemetry</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md items-end">
                  <div className="flex flex-col gap-space-xs">
                    <label className="font-label-md text-label-md text-on-surface-variant font-semibold">Total Declared Acreage</label>
                    <div className="flex rounded-lg shadow-sm overflow-hidden">
                      <input
                        className="flex-1 h-10 px-space-md bg-surface-container-lowest text-on-surface font-metric-num text-metric-num text-xl focus:outline-none"
                        id="farm-size-val"
                        step="0.1"
                        type="number"
                        value={farmSize}
                        onChange={(e) => setFarmSize(e.target.value)}
                      />
                      <div className="flex bg-surface-container-low p-1 items-center">
                        <button
                          onClick={() => handleUnitChange("ha")}
                          className={`px-space-sm py-1 font-label-md text-label-md rounded transition-colors ${
                            unit === "ha" ? "bg-primary text-on-primary font-bold" : "text-on-surface hover:text-primary"
                          }`}
                          id="btn-ha"
                          type="button"
                        >
                          Hectares (Ha)
                        </button>
                        <button
                          onClick={() => handleUnitChange("ac")}
                          className={`px-space-sm py-1 font-label-md text-label-md rounded transition-colors ${
                            unit === "ac" ? "bg-primary text-on-primary font-bold" : "text-on-surface hover:text-primary"
                          }`}
                          id="btn-ac"
                          type="button"
                        >
                          Acres
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-space-xs">
                    <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">GPS Anchor Coordinate</label>
                    <div className="h-10 px-space-md bg-surface-container-low rounded-lg flex items-center justify-between text-on-surface font-body-sm text-body-sm font-mono">
                      <span>8.2140° N, 3.5820° E</span>
                      <Icon name="my_location" className="text-secondary text-[18px]" />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">Select Field Boundary Source</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
                    <button
                      onClick={() => {
                        setBoundarySource("pin");
                        showScreenToast("Boundary mode: Interactive Map Pin & Polygon.");
                      }}
                      className={`p-space-sm rounded-lg flex flex-col gap-1 text-left transition-all ${
                        boundarySource === "pin" ? "bg-primary-container text-on-primary shadow-sm" : "bg-surface-container-low hover:bg-surface-container text-on-surface"
                      }`}
                      type="button"
                    >
                      <Icon name="pin_drop" className="text-[20px]" />
                      <span className="font-label-md text-label-md font-bold">Coordinates / Map Pin</span>
                      <span className="font-label-sm text-label-sm opacity-90">Interactive Pin &amp; Polygon</span>
                    </button>
                    <button
                      onClick={() => {
                        setBoundarySource("mobile");
                        showScreenToast("Boundary mode: PostGIS Live Sync via Field Agent App.");
                      }}
                      className={`p-space-sm rounded-lg flex flex-col gap-1 text-left transition-all ${
                        boundarySource === "mobile" ? "bg-primary-container text-on-primary shadow-sm" : "bg-surface-container-low hover:bg-surface-container text-on-surface"
                      }`}
                      type="button"
                    >
                      <Icon name="directions_walk" className="text-primary text-[20px]" />
                      <span className="font-label-md text-label-md font-bold">Walk Boundary Mobile</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">PostGIS Live Sync (App)</span>
                    </button>
                    <button
                      onClick={() => {
                        setBoundarySource("survey");
                        showScreenToast("Boundary mode: Survey Cadastral PDF Sheet parser.");
                      }}
                      className={`p-space-sm rounded-lg flex flex-col gap-1 text-left transition-all ${
                        boundarySource === "survey" ? "bg-primary-container text-on-primary shadow-sm" : "bg-surface-container-low hover:bg-surface-container text-on-surface"
                      }`}
                      type="button"
                    >
                      <Icon name="map" className="text-primary text-[20px]" />
                      <span className="font-label-md text-label-md font-bold">Survey Cadastral PDF</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Registered Surveyor Sheet</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md lg:p-space-lg flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="agriculture" className="text-primary text-[22px]" />
                    <h2 className="font-headline-md text-headline-md text-on-surface">3. Primary Crops &amp; Syndicate Requirements</h2>
                  </div>
                  <span className="font-label-sm text-label-sm bg-surface-container px-space-sm py-0.5 rounded-full text-on-surface-variant">SW Pilot Crops (15)</span>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <span className="font-label-md text-label-md text-on-surface-variant font-semibold">Select Primary Cultivation Focus (Multi-Select)</span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {AVAILABLE_CROPS.map((crop) => {
                      const isSelected = selectedCrops.includes(crop.id);
                      return (
                        <button
                          key={crop.id}
                          onClick={() => toggleCrop(crop.id)}
                          className={`crop-pill px-space-md py-1.5 rounded-full font-label-md text-label-md flex items-center gap-1.5 transition-all ${
                            isSelected ? "bg-primary text-on-primary font-bold shadow-sm" : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                          }`}
                          type="button"
                        >
                          {isSelected && <Icon name="check" className="text-[16px]" />}
                          <span>{crop.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md mt-space-xs">
                  <div className="flex flex-col gap-space-xs">
                    <label className="font-label-md text-label-md text-on-surface-variant font-semibold">Current Operational Season Cycle</label>
                    <select defaultValue="early-2026" className="w-full h-10 px-space-md bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="early-2026">Early Season 2026 (Onset Rainfed)</option>
                      <option value="dry-irrigated">Irrigated Dry Season (Basin Pump)</option>
                      <option value="late-rain">Late Rain Season 2026</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-space-xs">
                    <label className="font-label-md text-label-md text-on-surface-variant font-semibold">Intercropping Regime</label>
                    <select defaultValue="maize-cassava" className="w-full h-10 px-space-md bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="maize-cassava">Maize + Cassava Relay (Dominant SW Pattern)</option>
                      <option value="sole-crop">Sole Commercial Crop Stand</option>
                      <option value="legume-rotation">Cereal + Cowpea Intercrop</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-space-xs mt-space-xs">
                  <span className="font-label-md text-label-md text-on-surface-variant font-semibold">Immediate Pilot Syndicate Ingestion Needs (Priority Allocation)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm pt-1">
                    <label className="flex items-start gap-space-sm p-space-sm bg-surface-container-low rounded-lg cursor-pointer hover:bg-surface-container transition-colors">
                      <input defaultChecked className="mt-1 w-4 h-4 rounded text-primary accent-primary" type="checkbox" />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-semibold">Mechanization &amp; Tractor Hire</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">Tillage, disc ploughing &amp; harrowing service dispatch</span>
                      </div>
                    </label>
                    <label className="flex items-start gap-space-sm p-space-sm bg-surface-container-low rounded-lg cursor-pointer hover:bg-surface-container transition-colors">
                      <input defaultChecked className="mt-1 w-4 h-4 rounded text-primary accent-primary" type="checkbox" />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-semibold">Certified Seed Input Supply</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">SAMMAZ hybrid maize &amp; TMS cassava stems</span>
                      </div>
                    </label>
                    <label className="flex items-start gap-space-sm p-space-sm bg-surface-container-low rounded-lg cursor-pointer hover:bg-surface-container transition-colors">
                      <input defaultChecked className="mt-1 w-4 h-4 rounded text-primary accent-primary" type="checkbox" />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-semibold">Soil Chemistry Lab Analysis</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">NPK deficiency &amp; pH testing via IITA-certified hub</span>
                      </div>
                    </label>
                    <label className="flex items-start gap-space-sm p-space-sm bg-surface-container-low rounded-lg cursor-pointer hover:bg-surface-container transition-colors">
                      <input className="mt-1 w-4 h-4 rounded text-primary accent-primary" type="checkbox" />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-semibold">Offtaker Forward Escrow</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">Ready harvest inventory matching to buyers</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 flex flex-col gap-space-lg">
              <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md lg:p-space-lg flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="satellite_alt" className="text-secondary text-[22px]" />
                    <h3 className="font-headline-md text-headline-md text-on-surface">Spatial Geometry Preview</h3>
                  </div>
                  <span className="font-label-sm text-label-sm text-secondary bg-secondary-container/40 px-2.5 py-0.5 rounded-full font-bold">12.4 Ha Verified</span>
                </div>
                <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-sm">
                  <div className="w-full h-full bg-cover bg-center" data-location="Iseyin, Oyo State, Nigeria" style={{ backgroundImage: "url('/images/screens/0ee7850993e4.webp')" }} />
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" fill="none" preserveAspectRatio="none" viewBox="0 0 400 240">
                    <polygon className="fill-primary/20 stroke-primary stroke-[3]" points="70,45 280,30 350,180 180,210 50,150" strokeDasharray="6 3" />
                    <circle className="fill-secondary stroke-surface-container-lowest stroke-2" cx="70" cy="45" r="5" />
                    <circle className="fill-secondary stroke-surface-container-lowest stroke-2" cx="280" cy="30" r="5" />
                    <circle className="fill-secondary stroke-surface-container-lowest stroke-2" cx="350" cy="180" r="5" />
                    <circle className="fill-secondary stroke-surface-container-lowest stroke-2" cx="180" cy="210" r="5" />
                    <circle className="fill-secondary stroke-surface-container-lowest stroke-2" cx="50" cy="150" r="5" />
                    <circle className="fill-primary stroke-surface-container-lowest stroke-2 animate-ping" cx="190" cy="120" opacity="0.4" r="8" />
                    <circle className="fill-primary stroke-surface-container-lowest stroke-2" cx="190" cy="120" r="6" />
                  </svg>
                  <div className="absolute top-3 left-3 bg-surface-container-lowest/90 px-space-sm py-1 rounded-md shadow-sm backdrop-blur-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    <span className="font-label-sm text-label-sm text-on-surface font-semibold">Cluster #04 Perimeter</span>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-surface-container-lowest/90 px-space-sm py-1 rounded-md shadow-sm backdrop-blur-sm flex flex-col text-right">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Computed Perimeter</span>
                    <span className="font-label-md text-label-md text-primary font-bold">1,780m · 12.4 Ha</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-space-xs text-center bg-surface-container-low p-space-sm rounded-lg">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Soil Type</span>
                    <span className="font-label-md text-label-md font-bold text-on-surface">Ferric Luvisols</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Basin Slope</span>
                    <span className="font-label-md text-label-md font-bold text-on-surface">2.4% (Gentle)</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Water Table</span>
                    <span className="font-label-md text-label-md font-bold text-secondary">Optimal (14m)</span>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md lg:p-space-lg flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="fact_check" className="text-primary text-[22px]" />
                    <h3 className="font-headline-md text-headline-md text-on-surface">Pilot Readiness Checklist</h3>
                  </div>
                  <span className="font-label-sm text-label-sm text-primary font-bold">Document 74</span>
                </div>
                <div className="flex flex-col gap-space-sm">
                  <div className="flex items-start gap-space-sm p-space-sm bg-surface-container-low/70 rounded-lg">
                    <Icon name="check_circle" className="text-secondary text-[20px] mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md font-bold text-on-surface">Farmer KYC &amp; BVN/NIN Match</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Validated against NIMC Central Registry</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-space-sm p-space-sm bg-primary-container/10 rounded-lg">
                    <Icon name="radio_button_checked" className="text-primary text-[20px] mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md font-bold text-primary">Farm Cadastral Boundary Anchor</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Resolving Iseyin Savanna Cluster Coordinates</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-space-sm p-space-sm bg-surface-container-low/40 rounded-lg opacity-80">
                    <Icon name="radio_button_unchecked" className="text-on-surface-variant text-[20px] mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md font-semibold text-on-surface-variant">Crop Scheduling &amp; Soil Profiling</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">SAMMAZ-15 Nitrogen Baseline Mapping</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-space-sm p-space-sm bg-surface-container-low/40 rounded-lg opacity-80">
                    <Icon name="radio_button_unchecked" className="text-on-surface-variant text-[20px] mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md font-semibold text-on-surface-variant">Tractor Syndicate Linkage</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Automated match to nearest active hub</span>
                    </div>
                  </div>
                </div>
                <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center gap-space-sm mt-space-xs">
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary font-bold flex-shrink-0">
                    <Icon name="support_agent" className="text-[20px]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Assigned ADP Extension Officer</span>
                    <span className="font-label-md text-label-md text-on-surface font-bold">Engr. Babatunde Ogunlesi · Oyo ADP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full bg-surface-container-lowest rounded-xl shadow-sm p-space-md lg:p-space-lg mt-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-sm text-on-surface-variant">
              <Icon name="verified" className="text-secondary text-[24px]" />
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm font-semibold text-on-surface">Backed by Oyo &amp; Ogun State Agricultural Development Programme (ADP)</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">100% encrypted and protected under Nigeria Data Protection Act (NDPA 2023).</span>
              </div>
            </div>
            <div className="flex items-center gap-space-md w-full md:w-auto justify-end">
              <button
                onClick={handleSaveDraft}
                className="w-full sm:w-auto px-space-lg py-2.5 bg-surface-container text-on-surface hover:bg-surface-container-high font-label-md text-label-md font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                type="button"
              >
                <Icon name="bookmark" className="text-[18px]" />
                <span>Save as Draft &amp; Exit</span>
              </button>
              <ScreenDialog title="Confirm & Launch" side="center" panel={modalCompleteSetup}>
                <button
                  onClick={() => {}}
                  className="w-full sm:w-auto px-space-xl py-2.5 bg-primary-container text-on-primary hover:bg-primary font-label-md text-label-md font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-space-xs"
                  type="button"
                >
                  <span>Complete Farm Setup &amp; Launch Dashboard</span>
                  <Icon name="arrow_forward" className="text-[20px]" />
                </button>
              </ScreenDialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
