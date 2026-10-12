"use client";

// Ported from the "research_extension_10.5" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { useState } from "react";
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogClose, showScreenToast } from "@/components/ds/screen-dialog";
import { downloadFile } from "@/lib/download";
import type { ScreenProps } from "./types";

interface Trial {
  id: string;
  code: string;
  zoneType: "savanna" | "rainforest";
  location: string;
  title: string;
  host: string;
  statusBadge: string;
  metric1Label: string;
  metric1Val: string;
  metric2Label: string;
  metric2Val: string;
  metric3Label: string;
  metric3Val: string;
  metric4Label: string;
  metric4Val: string;
  protocols: string;
}

const INITIAL_TRIALS: Trial[] = [
  {
    id: "trl-1",
    code: "TRL-2026-MZ-04",
    zoneType: "savanna",
    location: "Saki West LGA, Oke-Ogun Savanna Belt",
    title: "SAMMAZ-62 Drought Tolerance & Nitrogen-Use Efficiency Trial",
    host: "Oke-Ogun Maize Seed Outgrower Syndicate • Block Setup: 4x Replications (RBD 4x)",
    statusBadge: "Canopy Vigour Optimal",
    metric1Label: "Soil NPK Baseline",
    metric1Val: "14:10:18 • pH 6.2",
    metric2Label: "Mean Canopy NDVI",
    metric2Val: "0.78 (Sentinel-2 Sync)",
    metric3Label: "Water Deficit Index",
    metric3Val: "-8.4% (Tolerant band)",
    metric4Label: "Projected Yield vs Control",
    metric4Val: "+32% (+1.8 t/ha)",
    protocols: "Split Urea Application (DAP + 30 DAS) vs Micro-dosing @ 12kg/ha • Drone pass every 7 days.",
  },
  {
    id: "trl-2",
    code: "TRL-2026-CS-11",
    zoneType: "rainforest",
    location: "Ikenne Pilot Station, Ogun Agro-Climatic Zone",
    title: "Cassava Mosaic Disease (CMD) Resistance: TME-419 vs NextGen TMS-01/1371",
    host: "IITA Breeding Unit in collaboration with Ogun State ADP • 18 Hectares monitored",
    statusBadge: "Zero Whitefly Vector Outbreak",
    metric1Label: "Whitefly Pressure",
    metric1Val: "1.2 flies/plant (Low)",
    metric2Label: "Canopy Biomass Index",
    metric2Val: "0.82 (High leaf density)",
    metric3Label: "Root Starch Estimate",
    metric3Val: "26.8% Dry Matter",
    metric4Label: "Yield Delta Projected",
    metric4Val: "+24.5 t/ha (+28%)",
    protocols: "Strict disease index scoring at 3, 6, and 9 months • Bio-fortification test for Provitamin A content.",
  },
  {
    id: "trl-3",
    code: "TRL-2026-BIO-09",
    zoneType: "savanna",
    location: "Ilora Farm Settlement, Oyo Central",
    title: "Biocontrol of Fall Armyworm (FAW) via Trichogramma Wasps & Neem",
    host: "Lead Researcher: Dr. K. Adebayo (NIHORT / OAU Entomological Cluster)",
    statusBadge: "2nd Release Phase Active",
    metric1Label: "Egg Parasitism Rate",
    metric1Val: "71.4% Reached",
    metric2Label: "Larval Folio Damage",
    metric2Val: "< 4.2% of Whorls",
    metric3Label: "Synthetic Spray Reduct.",
    metric3Val: "-85% Chemical Inputs",
    metric4Label: "Net Margin Adv.",
    metric4Val: "+₦74,000 / ha",
    protocols: "Parasitoid wasp card placement every 10 meters • Weekly scout counts across 60 sampling quadrants.",
  },
  {
    id: "trl-4",
    code: "TRL-2026-RC-02",
    zoneType: "rainforest",
    location: "Mokoloki Lowland Basins, Ogun State",
    title: "Lowland Rice System of Rice Intensification (SRI) Water-Saving Trial (Faro-67)",
    host: "Partner: NCRI Badeggi & Ogun-Oshun River Basin Development Authority",
    statusBadge: "Tillering Evaluation",
    metric1Label: "Irrigation Water Savings",
    metric1Val: "38% Less Inflow",
    metric2Label: "Effective Tillers/Hill",
    metric2Val: "42 (vs 16 Conventional)",
    metric3Label: "Seed Rate Utilization",
    metric3Val: "8 kg/ha (80% drop)",
    metric4Label: "Target Yield Projection",
    metric4Val: "6.8 t/ha (+44%)",
    protocols: "Alternate wetting & drying (AWD) sensor monitoring • Single seedling transplanting at 10 days age.",
  },
];

export function ResearchExtension(_props: ScreenProps) {
  const [trials, setTrials] = useState<Trial[]>(INITIAL_TRIALS);
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [fawAdvisoryApproved, setFawAdvisoryApproved] = useState<boolean>(false);
  const [cbbTicketValidated, setCbbTicketValidated] = useState<boolean>(false);
  const [deployedSops, setDeployedSops] = useState<Record<string, boolean>>({});

  // New protocol modal state
  const [protoCode, setProtoCode] = useState<string>("TRL-2026-MZ-09");
  const [protoTitle, setProtoTitle] = useState<string>("");
  const [protoLocation, setProtoLocation] = useState<string>("Iseyin Savanna Cluster");
  const [protoInstitution, setProtoInstitution] = useState<string>("IITA Ibadan");

  const filteredTrials = trials.filter((t) => {
    if (zoneFilter === "all") return true;
    return t.zoneType === zoneFilter;
  });

  const handleExportPhenology = () => {
    const csvContent =
      "Trial Code,Zone,Location,Title,Host Institution,Metric 1,Metric 2,Yield Delta,Status\n" +
      trials
        .map(
          (t) =>
            `"${t.code}","${t.zoneType}","${t.location}","${t.title}","${t.host}","${t.metric1Label}: ${t.metric1Val}","${t.metric2Label}: ${t.metric2Val}","${t.metric4Val}","${t.statusBadge}"`
        )
        .join("\n");

    downloadFile("cultivanode-phenology-raw-trials-2026.csv", csvContent, "text/csv");
    showScreenToast("Raw Phenology CSV dataset exported.");
  };

  const handleCreateProtocol = () => {
    if (!protoTitle.trim()) {
      showScreenToast("Please provide protocol title before publishing.");
      return;
    }
    const newTrial: Trial = {
      id: `trl-${Date.now()}`,
      code: protoCode,
      zoneType: protoLocation.toLowerCase().includes("savanna") ? "savanna" : "rainforest",
      location: protoLocation,
      title: protoTitle,
      host: `${protoInstitution} Research Unit • 4x Replications`,
      statusBadge: "Phase 1 Initiated",
      metric1Label: "Soil Baseline",
      metric1Val: "pH 6.4 (Standard)",
      metric2Label: "Canopy Biomass",
      metric2Val: "0.72 Baseline",
      metric3Label: "Moisture Status",
      metric3Val: "Optimal Field Capacity",
      metric4Label: "Target Delta",
      metric4Val: "+25% Target",
      protocols: "Standardized CGIAR phenotyping protocol with Sentinel-2 drone overlay.",
    };
    setTrials([newTrial, ...trials]);
    showScreenToast(`Experimental protocol ${protoCode} registered and published to research portal.`);
    setProtoTitle("");
  };

  const handleDeploySop = (sopId: string, sopName: string) => {
    setDeployedSops((prev) => ({ ...prev, [sopId]: true }));
    showScreenToast(`${sopName} deployed to 124 field tablets and offline farmer knowledge base.`);
  };

  const panelNewProtocol = (
    <div className="w-full max-w-lg rounded-xl bg-surface-container-lowest shadow-2xl p-space-md flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-surface-container">
        <div className="flex items-center gap-2">
          <Icon name="science" className="text-secondary text-xl" />
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">New Experimental Research Protocol</h3>
        </div>
        <ScreenDialogClose>
          <button onClick={() => {}} className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface" type="button">
            <Icon name="close" className="text-lg" />
          </button>
        </ScreenDialogClose>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1">Trial Protocol Code</label>
          <input
            className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-mono text-body-sm focus:outline-none"
            value={protoCode}
            onChange={(e) => setProtoCode(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1">Trial Title / Varietal Hypothesis</label>
          <input
            className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-sm focus:outline-none"
            placeholder="e.g. Provitamin A Bio-fortified Cassava Phenotyping in Lowland Acid Soils"
            value={protoTitle}
            onChange={(e) => setProtoTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1">Host LGA / Microclimate</label>
          <input
            className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-sm focus:outline-none"
            value={protoLocation}
            onChange={(e) => setProtoLocation(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1">Lead Research Institution</label>
          <select
            className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-sm focus:outline-none cursor-pointer"
            value={protoInstitution}
            onChange={(e) => setProtoInstitution(e.target.value)}
          >
            <option>IITA Ibadan (Breeding Unit)</option>
            <option>NIHORT (Horticultural Research)</option>
            <option>NCRI Badeggi (Rice Breeding)</option>
            <option>OAU Ile-Ife (Agronomy Dept)</option>
            <option>IAR&amp;T Moor Plantation (Soil Chemistry)</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-surface-container">
        <ScreenDialogClose>
          <button onClick={() => {}} className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md" type="button">
            Cancel
          </button>
        </ScreenDialogClose>
        <ScreenDialogClose>
          <button
            className="px-5 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container"
            type="button"
            onClick={handleCreateProtocol}
          >
            Register Protocol
          </button>
        </ScreenDialogClose>
      </div>
    </div>
  );

  const panelDispatchAlert = (
    <div className="w-full max-w-lg rounded-xl bg-surface-container-lowest shadow-2xl p-space-md flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-surface-container">
        <div className="flex items-center gap-2">
          <Icon name="broadcast_on_personal" className="text-primary text-xl" />
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Dispatch Research-Backed Extension Alert</h3>
        </div>
        <ScreenDialogClose>
          <button onClick={() => {}} className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface" type="button">
            <Icon name="close" className="text-lg" />
          </button>
        </ScreenDialogClose>
      </div>
      <div className="space-y-3">
        <div className="p-3 rounded-lg bg-surface-container-low text-body-sm space-y-1">
          <span className="font-semibold text-primary block">Target Audience:</span>
          <span>All 124 Field Extension Officers &amp; Registered ADP Cluster Smallholders</span>
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1">Advisory Subject</label>
          <input
            className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-sm focus:outline-none"
            defaultValue="Urgent FAW Infestation Alert: Emamectin Micro-Spray Window"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1">Curative Instructions (English + Yorùbá)</label>
          <textarea
            className="w-full p-2.5 rounded-lg bg-surface-container-low text-on-surface font-body-sm focus:outline-none resize-none"
            rows={3}
            defaultValue="Scout corn whorls for pinhole feeding damage. Apply 5% SG Emamectin Benzoate (4g/15L knapsack) at early dusk. E kilo fawon agbe lati fura si kokoro armyworm lori agbado."
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-surface-container">
        <ScreenDialogClose>
          <button
            className="px-5 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container"
            type="button"
            onClick={() => {
              showScreenToast("Extension advisory broadcasted to 124 field agents and rural SMS network.");
            }}
          >
            Dispatch Omnichannel Alert
          </button>
        </ScreenDialogClose>
      </div>
    </div>
  );

  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <div className="px-space-md lg:px-space-xl py-space-lg space-y-space-lg max-w-[1680px] mx-auto w-full">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md">
            <div className="space-y-1">
              <div className="flex items-center gap-space-xs text-on-surface-variant">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold">Research Portal §10.5 &amp; §22</span>
                <span>•</span>
                <span className="font-body-sm text-body-sm">Field Trials, Phenotyping &amp; Advisory Desk</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight">Agricultural Research &amp; Extension Operations</h1>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-4xl">
                Coordinated phenology protocols with <strong>IITA Ibadan</strong>, <strong>NIHORT</strong>, <strong>NCRI Badeggi</strong>, <strong>OAU Ile-Ife</strong> &amp; <strong>Oyo/Ogun ADP Extension Networks</strong>.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-space-xs self-start xl:self-auto">
              <button
                className="inline-flex items-center gap-space-xs px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-all"
                type="button"
                onClick={handleExportPhenology}
              >
                <Icon name="cloud_download" className="text-[18px] text-secondary" />
                <span>Raw Phenology CSV</span>
              </button>
              <ScreenDialog title="New Experimental Protocol" side="center" panel={panelNewProtocol}>
                <button onClick={() => {}} className="inline-flex items-center gap-space-xs px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-all" type="button">
                  <Icon name="science" className="text-[18px] text-secondary" />
                  <span>New Experimental Protocol</span>
                </button>
              </ScreenDialog>
              <ScreenDialog title="Dispatch Extension Alert" side="center" panel={panelDispatchAlert}>
                <button onClick={() => {}} className="inline-flex items-center gap-space-xs px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md shadow-sm transition-all" type="button">
                  <Icon name="broadcast_on_personal" className="text-[18px]" />
                  <span>Dispatch Extension Alert</span>
                </button>
              </ScreenDialog>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
            <div className="flex items-center gap-space-sm px-space-md py-2.5 rounded-lg bg-surface-container-lowest shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-secondary shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Federated Protocol</div>
                <div className="font-label-md text-label-md text-on-surface font-semibold truncate">CGIAR Open Data Protocol Compliant</div>
              </div>
              <Icon name="verified" className="text-secondary text-[20px]" />
            </div>
            <div className="flex items-center gap-space-sm px-space-md py-2.5 rounded-lg bg-surface-container-lowest shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-secondary shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Data Governance</div>
                <div className="font-label-md text-label-md text-on-surface font-semibold truncate">Farmer Consent: 100% Signed NDPA 2023</div>
              </div>
              <Icon name="lock_person" className="text-secondary text-[20px]" />
            </div>
            <div className="flex items-center gap-space-sm px-space-md py-2.5 rounded-lg bg-surface-container-lowest shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-secondary-fixed-dim shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Field Status</div>
                <div className="font-label-md text-label-md text-on-surface font-semibold truncate">Active Phenology Cycle: 2026 Early Rains</div>
              </div>
              <Icon name="calendar_view_week" className="text-secondary text-[20px]" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-space-sm">
            <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Controlled Trials</span>
                <Icon name="biotech" className="text-primary text-[20px]" />
              </div>
              <div className="my-2">
                <div className="font-metric-num text-metric-num text-primary">34</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">18 Agro-Microclimates</div>
              </div>
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary">
                <Icon name="terrain" className="text-[14px]" /> Savanna vs Rainforest
              </div>
            </div>
            <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Trial Hectarage</span>
                <Icon name="grid_goldenratio" className="text-primary text-[20px]" />
              </div>
              <div className="my-2">
                <div className="font-metric-num text-metric-num text-primary">420 ha</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">142 Host Pilot Farms</div>
              </div>
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-on-surface">
                <Icon name="domain_verification" className="text-[14px] text-secondary" /> Geo-Fenced &amp; Soil-Tagged
              </div>
            </div>
            <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Germplasm Lines</span>
                <Icon name="psychology_alt" className="text-primary text-[20px]" />
              </div>
              <div className="my-2">
                <div className="font-metric-num text-metric-num text-primary">16 Lines</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">SAMMAZ-62, TMS, Faro-67</div>
              </div>
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary">
                <Icon name="water_drop" className="text-[14px]" /> Drought &amp; CMD Resistant
              </div>
            </div>
            <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Extension SLA</span>
                <Icon name="support_agent" className="text-primary text-[20px]" />
              </div>
              <div className="my-2">
                <div className="font-metric-num text-metric-num text-primary">1.6 Days</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">124 Agents In Field</div>
              </div>
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary">
                <Icon name="trending_down" className="text-[14px]" /> -0.4d vs Target Benchmark
              </div>
            </div>
            <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Production SOPs</span>
                <Icon name="menu_book" className="text-primary text-[20px]" />
              </div>
              <div className="my-2">
                <div className="font-metric-num text-metric-num text-primary">48 SOPs</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Peer-Reviewed v2.4</div>
              </div>
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-on-surface">
                <Icon name="fact_check" className="text-[14px] text-secondary" /> Published to Field App
              </div>
            </div>
            <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Data Integrity</span>
                <Icon name="hub" className="text-primary text-[20px]" />
              </div>
              <div className="my-2">
                <div className="font-metric-num text-metric-num text-primary">98.7%</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Drone / Telemetry Match</div>
              </div>
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary">
                <Icon name="done_all" className="text-[14px]" /> 0 Missing Weather Vars
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg">
            <div className="xl:col-span-8 flex flex-col gap-space-md">
              <div className="p-space-lg rounded-lg bg-surface-container-lowest shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-md gap-space-sm border-b border-surface-container">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">Panel A</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-container text-on-surface-variant">Randomized Complete Block Designs</span>
                    </div>
                    <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">Active Research Trials &amp; Varietal Phenotyping</h2>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Filter Zone:</span>
                    {[
                      { key: "all", label: "All (34)" },
                      { key: "savanna", label: "Savanna" },
                      { key: "rainforest", label: "Rainforest" },
                    ].map((item) => (
                      <button
                        key={item.key}
                        className={`px-2.5 py-1 rounded-lg text-label-sm font-label-sm transition-colors ${
                          zoneFilter === item.key ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                        }`}
                        type="button"
                        onClick={() => setZoneFilter(item.key)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-space-md mt-space-sm">
                  {filteredTrials.map((trial) => (
                    <div key={trial.id} className="p-space-md rounded-lg bg-surface-container-low transition-all hover:bg-surface-container/70 border border-surface-container/40">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-space-sm pb-space-sm">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-secondary/10 text-secondary uppercase">{trial.code}</span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant">{trial.location}</span>
                          </div>
                          <h3 className="font-headline-sm text-headline-sm text-on-surface mt-1">{trial.title}</h3>
                          <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{trial.host}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-sm font-label-sm font-semibold bg-secondary-fixed/50 text-on-secondary-fixed-variant">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> {trial.statusBadge}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm py-2">
                        <div className="bg-surface-container-lowest p-2 rounded-lg">
                          <div className="font-label-sm text-label-sm text-on-surface-variant">{trial.metric1Label}</div>
                          <div className="font-label-md text-label-md text-on-surface font-semibold mt-0.5">{trial.metric1Val}</div>
                        </div>
                        <div className="bg-surface-container-lowest p-2 rounded-lg">
                          <div className="font-label-sm text-label-sm text-on-surface-variant">{trial.metric2Label}</div>
                          <div className="font-label-md text-label-md text-secondary font-semibold mt-0.5">{trial.metric2Val}</div>
                        </div>
                        <div className="bg-surface-container-lowest p-2 rounded-lg">
                          <div className="font-label-sm text-label-sm text-on-surface-variant">{trial.metric3Label}</div>
                          <div className="font-label-md text-label-md text-on-surface font-semibold mt-0.5">{trial.metric3Val}</div>
                        </div>
                        <div className="bg-surface-container-lowest p-2 rounded-lg">
                          <div className="font-label-sm text-label-sm text-on-surface-variant">{trial.metric4Label}</div>
                          <div className="font-label-md text-label-md text-secondary font-bold mt-0.5">{trial.metric4Val}</div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-body-sm text-on-surface-variant pt-2 text-xs gap-2 border-t border-surface-container/50">
                        <div>
                          <strong className="text-on-surface">Protocols:</strong> {trial.protocols}
                        </div>
                        <button
                          className="inline-flex items-center gap-1 text-secondary font-semibold hover:underline"
                          type="button"
                          onClick={() => {
                            downloadFile(
                              `Dataset-${trial.code}.txt`,
                              `CULTIVANODE CGIAR RESEARCH TRIAL DATASET\nTrial Code: ${trial.code}\nLocation: ${trial.location}\nTitle: ${trial.title}\nHost: ${trial.host}\nBaseline: ${trial.metric1Val}\nNDVI Canopy: ${trial.metric2Val}\nYield Projection: ${trial.metric4Val}\nProtocols: ${trial.protocols}`,
                              "text/plain"
                            );
                            showScreenToast(`Phenotypic dataset for ${trial.code} exported.`);
                          }}
                        >
                          View Block Layout <Icon name="arrow_forward" className="text-[14px]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="xl:col-span-4 flex flex-col gap-space-md">
              <div className="p-space-lg rounded-lg bg-surface-container-lowest shadow-sm flex flex-col h-full">
                <div className="flex items-center justify-between pb-space-md border-b border-surface-container">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">Panel B</span>
                      <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
                    </div>
                    <h2 className="font-headline-sm text-headline-sm text-primary tracking-tight">Scouting &amp; Pathogen Stream</h2>
                  </div>
                  <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-semibold">
                    {fawAdvisoryApproved && cbbTicketValidated ? "0 Tickets Pending" : "5 Tickets Pending"}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant my-space-sm">
                  Live diagnostic queue from ADP scouts &amp; farmers awaiting validation by lead institutional phytopathologists.
                </p>
                <div className="space-y-space-md flex-1">
                  <div className="p-space-sm rounded-lg bg-surface-container-low space-y-2 border border-surface-container">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-error">Critical Pathogen Alert</span>
                        <div className="font-label-md text-label-md text-on-surface font-bold">Fall Armyworm (Spodoptera frugiperda)</div>
                        <div className="text-xs text-on-surface-variant">Plot #42, Ido LGA • Oyo State</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-container text-on-surface">88% AI Conf.</span>
                    </div>
                    <div className="relative rounded-lg overflow-hidden h-28 bg-surface-container">
                      <img className="w-full h-full object-cover" data-alt="Fall Armyworm on maize leaf" src="/images/screens/d171d98f757c.webp" alt="" loading="lazy" decoding="async" />
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-primary/80 text-[10px] text-on-primary font-mono">GEO: 7.502°N, 3.821°E</div>
                    </div>
                    <div className="text-xs bg-surface-container-lowest p-2 rounded">
                      <span className="font-semibold text-on-surface">Curative Protocol:</span> Emamectin Benzoate 5% SG application @ 4g per 15L backpack knapsack during early dusk.
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-primary">
                        <input defaultChecked className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer" type="checkbox" />
                        <span>Validated by Dr. Adebayo</span>
                      </label>
                      <button
                        className="px-2.5 py-1 rounded bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors"
                        type="button"
                        onClick={() => {
                          setFawAdvisoryApproved(true);
                          showScreenToast("Curative advisory approved and broadcasted to Ido LGA smallholders.");
                        }}
                      >
                        {fawAdvisoryApproved ? "Advisory Dispatched" : "Approve Advisory"}
                      </button>
                    </div>
                  </div>

                  <div className="p-space-sm rounded-lg bg-surface-container-low space-y-2 border border-surface-container">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Diagnostic Review</span>
                        <div className="font-label-md text-label-md text-on-surface font-bold">Cassava Bacterial Blight (Xanthomonas)</div>
                        <div className="text-xs text-on-surface-variant">Obafemi Owode LGA • Ogun State</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-container text-on-surface">94% AI Conf.</span>
                    </div>
                    <div className="relative rounded-lg overflow-hidden h-28 bg-surface-container">
                      <img className="w-full h-full object-cover" data-alt="Cassava Bacterial Blight on foliage" src="/images/screens/6cd7a5057c75.webp" alt="" loading="lazy" decoding="async" />
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-primary/80 text-[10px] text-on-primary font-mono">GEO: 6.953°N, 3.511°E</div>
                    </div>
                    <div className="text-xs bg-surface-container-lowest p-2 rounded">
                      <span className="font-semibold text-on-surface">Curative Protocol:</span> Prune infected stems, sterilize shears with sodium hypochlorite 1%, deploy copper oxychloride.
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-on-surface-variant">
                        <input checked={cbbTicketValidated} onChange={(e) => setCbbTicketValidated(e.target.checked)} className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer" type="checkbox" />
                        <span>{cbbTicketValidated ? "Signed by NIHORT" : "Awaiting Sign-off"}</span>
                      </label>
                      <button
                        className="px-2.5 py-1 rounded bg-secondary text-on-secondary text-xs font-semibold hover:bg-on-secondary-container transition-colors"
                        type="button"
                        onClick={() => {
                          setCbbTicketValidated(true);
                          showScreenToast("Cassava Bacterial Blight ticket validated and signed.");
                        }}
                      >
                        Validate Ticket
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  className="w-full mt-space-md py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md text-center transition-colors"
                  type="button"
                  onClick={() => {
                    showScreenToast("42 Phytopathology Field Reports synchronized with IITA Plant Health Center.");
                  }}
                >
                  View All 42 Field Reports
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg">
            <div className="xl:col-span-6 flex flex-col gap-space-md">
              <div className="p-space-lg rounded-lg bg-surface-container-lowest shadow-sm flex flex-col h-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-md gap-space-xs border-b border-surface-container">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">Panel C</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-container text-on-surface-variant">Oyo / Ogun ADP Coverage</span>
                    </div>
                    <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">Extension Officer Visitation &amp; Advisory Roster</h2>
                  </div>
                  <button
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface text-label-sm font-semibold hover:bg-surface-container-high self-start sm:self-auto transition-colors"
                    type="button"
                    onClick={() => {
                      showScreenToast("Extension LGA allocation wizard ready. 12 LGAs open for re-assignment.");
                    }}
                  >
                    <Icon name="person_add" className="text-[16px] text-secondary" /> Assign New LGA
                  </button>
                </div>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                        <th className="py-2.5 px-3 rounded-l-lg">Agent &amp; Certification</th>
                        <th className="py-2.5 px-3">Assigned LGA</th>
                        <th className="py-2.5 px-3 text-center">Workshops</th>
                        <th className="py-2.5 px-3">Demo Plot</th>
                        <th className="py-2.5 px-3 text-right rounded-r-lg">Satisfaction</th>
                      </tr>
                    </thead>
                    <tbody className="font-body-sm text-body-sm divide-y-0">
                      <tr className="hover:bg-surface-container-low/50">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-on-surface">Bolanle Fatoki, B.Agric</div>
                          <div className="text-xs text-secondary">ADP Lead Specialist • ID #482</div>
                        </td>
                        <td className="py-3 px-3 font-medium text-on-surface">Ibarapa East (Eruwa)</td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-semibold text-xs">4 sessions</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 text-xs text-secondary font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Active Biochar Plot
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-on-surface">4.9 / 5.0</div>
                          <div className="text-[11px] text-on-surface-variant">148 attendees</div>
                        </td>
                      </tr>
                      <tr className="bg-surface-container-low/30 hover:bg-surface-container-low/60">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-on-surface">Olumide Gbadamosi</div>
                          <div className="text-xs text-secondary">Agronomic Field Scout • ID #119</div>
                        </td>
                        <td className="py-3 px-3 font-medium text-on-surface">Iseyin (Oyo North)</td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-semibold text-xs">6 sessions</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 text-xs text-secondary font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> SAMMAZ Demo #08
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-on-surface">4.8 / 5.0</div>
                          <div className="text-[11px] text-on-surface-variant">210 attendees</div>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-container-low/50">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-on-surface">Folake Alabi, MSc</div>
                          <div className="text-xs text-secondary">Crop Protection Advisor • ID #302</div>
                        </td>
                        <td className="py-3 px-3 font-medium text-on-surface">Ijebu North (Ago-Iwoye)</td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-semibold text-xs">3 sessions</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 text-xs text-tertiary-fixed-dim font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container" /> Land Prep Stage
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-on-surface">5.0 / 5.0</div>
                          <div className="text-[11px] text-on-surface-variant">92 attendees</div>
                        </td>
                      </tr>
                      <tr className="bg-surface-container-low/30 hover:bg-surface-container-low/60">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-on-surface">Saheed Mustapha</div>
                          <div className="text-xs text-secondary">Irrigation Systems Tech • ID #524</div>
                        </td>
                        <td className="py-3 px-3 font-medium text-on-surface">Yewa North (Ayetoro)</td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-semibold text-xs">5 sessions</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 text-xs text-secondary font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> SRI Demo Wetting
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-on-surface">4.7 / 5.0</div>
                          <div className="text-[11px] text-on-surface-variant">175 attendees</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between pt-space-sm mt-auto border-t border-surface-container">
                  <span className="text-xs text-on-surface-variant">Showing 4 of 124 field agents active this cycle</span>
                  <button
                    className="text-xs font-semibold text-secondary hover:underline"
                    type="button"
                    onClick={() => {
                      downloadFile(
                        "Extension-Agents-Roster-Audit-2026.csv",
                        "Agent ID,Name,Qualification,Assigned LGA,Workshops,Demo Plots,Rating,Attendees\n482,Bolanle Fatoki,B.Agric,Ibarapa East,4,Active Biochar Plot,4.9,148\n119,Olumide Gbadamosi,Cert Agronomy,Iseyin,6,SAMMAZ Demo #08,4.8,210\n302,Folake Alabi,MSc Crop Prot,Ijebu North,3,Land Prep Stage,5.0,92\n524,Saheed Mustapha,B.Eng Irrigation,Yewa North,5,SRI Demo Wetting,4.7,175\n",
                        "text/csv"
                      );
                      showScreenToast("Full Extension Roster Audit exported to CSV.");
                    }}
                  >
                    Download Full Roster Audit
                  </button>
                </div>
              </div>
            </div>

            <div className="xl:col-span-6 flex flex-col gap-space-md">
              <div className="p-space-lg rounded-lg bg-surface-container-lowest shadow-sm flex flex-col h-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-md gap-space-xs border-b border-surface-container">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">Panel D</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-container text-on-surface-variant">Sync with §11.5 Farmer Knowledge Node</span>
                    </div>
                    <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">Approved Agronomic Guidance SOP Library</h2>
                  </div>
                  <button
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-label-sm font-semibold hover:bg-primary-container self-start sm:self-auto transition-colors"
                    type="button"
                    onClick={() => {
                      showScreenToast("SOP publishing workflow initiated. Peer-review sign-off requested.");
                    }}
                  >
                    <Icon name="upload_file" className="text-[16px]" /> Publish Standard
                  </button>
                </div>

                <div className="space-y-space-sm flex-1 pt-2">
                  {[
                    {
                      id: "sop-1",
                      code: "SOP-MZ-2026-v2.4",
                      title: "Maize Integrated Stem Borer & Fall Armyworm IPM Protocol",
                      author: "Dr. K. Adebayo (IITA / COREN Agronomist) • Savanna & Forest Transition",
                      date: "Effective: Mar 2026",
                    },
                    {
                      id: "sop-2",
                      code: "SOP-CS-2026-v3.1",
                      title: "High-Tuber Density Cassava Fertilizer Micro-Dosing Regimen",
                      author: "Prof. T. Ogunlesi (NIHORT / Oyo ADP) • High-Rainfall Rainforest Zone",
                      date: "Effective: Feb 2026",
                    },
                    {
                      id: "sop-3",
                      code: "SOP-RC-2025-v1.9",
                      title: "System of Rice Intensification (SRI) Lowland Water Calibration",
                      author: "Dr. E. Ndatsu (NCRI Badeggi) • Lowland River Basins",
                      date: "Effective: Nov 2025",
                    },
                    {
                      id: "sop-4",
                      code: "SOP-SOIL-2026-v2.0",
                      title: "Acidic Soil Remediation via Local Calcined Agricultural Lime",
                      author: "Institute of Agricultural Research & Training (IAR&T) Moor Plantation",
                      date: "Effective: Jan 2026",
                    },
                  ].map((sop) => (
                    <div key={sop.id} className="p-space-sm rounded-lg bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm border border-surface-container">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-label-sm text-label-sm font-mono font-bold text-primary">{sop.code}</span>
                          <span className="text-[11px] px-2 py-0.2 rounded font-semibold bg-secondary-fixed/50 text-on-secondary-fixed-variant">{sop.date}</span>
                        </div>
                        <div className="font-label-md text-label-md text-on-surface font-semibold">{sop.title}</div>
                        <div className="text-xs text-on-surface-variant">{sop.author}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
                          title="Download Dossier PDF"
                          type="button"
                          onClick={() => {
                            downloadFile(
                              `${sop.code}.txt`,
                              `CULTIVANODE AGRONOMIC STANDARD OPERATING PROCEDURE\nCode: ${sop.code}\nTitle: ${sop.title}\nAuthor: ${sop.author}\nDate: ${sop.date}\nAccreditation: IITA / Oyo ADP Joint Taskforce\nDistributed under CGIAR Open Science License`,
                              "text/plain"
                            );
                            showScreenToast(`Standard ${sop.code} downloaded.`);
                          }}
                        >
                          <Icon name="picture_as_pdf" className="text-[18px]" />
                        </button>
                        <button
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors ${
                            deployedSops[sop.id] ? "bg-primary text-on-primary" : "bg-secondary text-on-secondary hover:bg-on-secondary-container"
                          }`}
                          type="button"
                          onClick={() => handleDeploySop(sop.id, sop.code)}
                        >
                          <Icon name="send_to_mobile" className="text-[14px]" />
                          <span>{deployedSops[sop.id] ? "Deployed" : "Deploy to Field App"}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-space-sm mt-auto border-t border-surface-container">
                  <span className="text-xs text-on-surface-variant">48 Versioned Agronomic Standards registered in repository</span>
                  <button
                    className="text-xs font-semibold text-secondary hover:underline"
                    type="button"
                    onClick={() => {
                      downloadFile(
                        "cultivanode-sop-repository-manifest.json",
                        JSON.stringify(
                          {
                            repository: "CultivaNode Peer-Reviewed Agronomic SOPs",
                            standardsCount: 48,
                            version: "2026.4",
                            institutions: ["IITA", "NIHORT", "NCRI", "OAU", "IAR&T"],
                            updatedAt: "2026-05-04T12:00:00Z",
                          },
                          null,
                          2
                        ),
                        "application/json"
                      );
                      showScreenToast("SOP repository manifest downloaded (JSON bundle).");
                    }}
                  >
                    Batch Export SOP Repository (.zip)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
