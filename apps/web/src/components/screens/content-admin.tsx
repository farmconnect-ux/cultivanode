"use client";

// Ported from the "content_knowledge_administration" design.
import { useState } from "react";
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogClose, showScreenToast } from "@/components/ds/screen-dialog";
import { downloadFile } from "@/lib/download";
import { slot, type ScreenProps } from "./types";

export type ContentAdminSlot = "hero";

export function ContentAdmin({ slots }: ScreenProps<ContentAdminSlot>) {
  const [activeTab, setActiveTab] = useState<"phenology" | "nutrients" | "spray" | "yoruba" | "audit">("phenology");

  // Modals
  const [isCreateDraftOpen, setIsCreateDraftOpen] = useState(false);
  const [isPublishRevisionsOpen, setIsPublishRevisionsOpen] = useState(false);
  const [isRollbackOpen, setIsRollbackOpen] = useState(false);
  const [isAddChemicalOpen, setIsAddChemicalOpen] = useState(false);
  const [isTranslationStudioOpen, setIsTranslationStudioOpen] = useState(false);
  const [reviewDiffItem, setReviewDiffItem] = useState<any | null>(null);

  // New Draft Form State
  const [draftTitle, setDraftTitle] = useState("");
  const [draftCrop, setDraftCrop] = useState("Maize (Zea mays)");
  const [draftZone, setDraftZone] = useState("Derived Savanna (Oke-Ogun / Oyo North)");
  const [draftInstitute, setDraftInstitute] = useState("IITA Maize Improvement Program");
  const [draftYield, setDraftYield] = useState("5.5 MT/Ha");

  // New Chemical Form State
  const [chemName, setChemName] = useState("");
  const [chemNafdac, setChemNafdac] = useState("");
  const [chemMaker, setChemMaker] = useState("");
  const [chemActive, setChemActive] = useState("");
  const [chemRate, setChemRate] = useState("");
  const [chemPhi, setChemPhi] = useState("14 Days");

  // Review Queue state
  const [reviewQueue, setReviewQueue] = useState([
    {
      id: "#STD-MZE-02",
      title: "Tomato Dry-Season Staking Protocol",
      submittedBy: "Dr. K. Alabi",
      appraiser: "NIHORT Vegetable Specialist",
      status: "In Review",
    },
    {
      id: "#STD-CAS-08",
      title: "Cassava Stems Pro-Vitamin A TME-419 Quality Standard",
      submittedBy: "NCRI Roots & Tubers Division",
      appraiser: "Active in Oyo and Osun field clusters",
      status: "Published v2.1",
    },
  ]);

  const handleCreateDraft = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreateDraftOpen(false);
    showScreenToast(`Created new agronomic standard draft: "${draftTitle || draftCrop}" (${draftZone})`);
  };

  const handleExportPackage = () => {
    const pkg = {
      manifest: "CultivaNode Agronomic Standards & Phenology Package v3.2",
      exportedAt: new Date().toISOString(),
      merkleRoot: "0x9b8210fe40ad551199aef04e",
      standardsCount: 38,
      verifiedCrops: 15,
      nafdacCompounds: 164,
      multilingualStrings: 4820,
      activeSpec: {
        crop: "Maize (Zea mays)",
        zone: "Derived Savanna (Oke-Ogun / Oyo North)",
        authority: "IITA & NIHORT Joint Advisory",
        stages: 6,
      },
    };
    downloadFile(JSON.stringify(pkg, null, 2), `CultivaNode_Agronomy_Package_v3.2_${new Date().toISOString().slice(0, 10)}.json`, "application/json");
    showScreenToast("Exported Agronomy Standards Package (JSON).");
  };

  const handleAddChemical = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddChemicalOpen(false);
    showScreenToast(`Registered NAFDAC chemical: "${chemName}" (Reg: ${chemNafdac})`);
  };

  const playAudioPrompt = (title: string, yorubaText: string) => {
    showScreenToast(`Playing Yoruba audio guidance: "${title}" (${yorubaText})`);
  };

  return (
    <div className="screen">
      <div className="flex flex-col w-full gap-space-lg pb-space-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
              <span className="hover:text-primary transition-colors cursor-pointer">Platform Administration</span>
              <Icon name="chevron_right" className="text-[14px]" />
              <span className="hover:text-primary transition-colors cursor-pointer">Knowledge &amp; Agronomy Standards</span>
              <Icon name="chevron_right" className="text-[14px]" />
              <span className="text-primary font-bold">Content &amp; Knowledge Administration (§11.5)</span>
            </div>
            <div className="flex items-center gap-space-sm flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-secondary" /> Agronomic Revision Engine Active (v2.8.4-rc2)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-container/20 text-on-primary-container font-label-sm text-label-sm font-semibold">
                <Icon name="verified" className="text-[14px] text-secondary" /> 15 Pilot Crops Ground-Truth Verified
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                SHA-256 Engine: <code className="font-mono text-[10px] text-primary">#9b82..f04e</code>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-space-sm flex-wrap shrink-0">
            <button
              onClick={() => setIsCreateDraftOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md hover:bg-surface-container transition-all shadow-sm"
              type="button"
            >
              <Icon name="add_circle" className="text-[18px]" />
              <span>New Standard Draft</span>
            </button>
            <button
              onClick={handleExportPackage}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md hover:bg-surface-container transition-all shadow-sm"
              type="button"
            >
              <Icon name="file_download" className="text-[18px]" />
              <span>Export Package (JSON/YAML)</span>
            </button>
            <button
              onClick={() => setIsPublishRevisionsOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-all shadow-sm"
              type="button"
            >
              <Icon name="publish" className="text-[18px]" />
              <span>Publish Approved Revisions</span>
            </button>
          </div>
        </div>

        {slot(slots, "hero", (
          <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-space-md">
              <div className="max-w-3xl flex flex-col gap-space-xs">
                <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight">Content &amp; Knowledge Administration</h1>
                <p className="font-body-md text-body-md text-on-surface-variant">Curate, calibrate, and version agronomic phenology templates, crop standards, NAFDAC-approved input formulations, veterinary protocols, and multilingual translations across South-West Nigeria agro-ecological zones.</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 self-start md:self-auto bg-surface-container-low p-2.5 rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-on-primary">
                  <Icon name="science" className="text-[24px]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Ecosystem Governance</span>
                  <span className="font-label-md text-label-md text-primary font-bold">NCRI · NIHORT · IITA Calibrated</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Phenology Templates</span>
              <span className="w-7 h-7 rounded bg-surface-container-low flex items-center justify-center text-primary">
                <Icon name="potted_plant" className="text-[18px]" />
              </span>
            </div>
            <div className="my-space-xs">
              <span className="font-metric-num text-metric-num text-on-surface font-bold">15 Active</span>
              <span className="text-xs text-secondary font-semibold ml-1">Crops</span>
            </div>
            <div className="flex flex-col gap-0.5 pt-space-xs text-on-surface-variant font-body-sm text-body-sm">
              <span className="truncate">8 Field/Staple, 7 Vegetables</span>
              <span className="text-[11px] text-outline font-mono">42 Calibrated Stages (SW Belts)</span>
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Agronomic Standards</span>
              <span className="w-7 h-7 rounded bg-surface-container-low flex items-center justify-center text-primary">
                <Icon name="verified_user" className="text-[18px]" />
              </span>
            </div>
            <div className="my-space-xs">
              <span className="font-metric-num text-metric-num text-on-surface font-bold">38 Rulesets</span>
            </div>
            <div className="flex flex-col gap-0.5 pt-space-xs text-on-surface-variant font-body-sm text-body-sm">
              <span className="text-secondary font-medium">100% Peer-Reviewed</span>
              <span className="text-[11px] text-outline truncate">IITA, NIHORT &amp; NCRI Citations</span>
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Agrochemical Index</span>
              <span className="w-7 h-7 rounded bg-surface-container-low flex items-center justify-center text-primary">
                <Icon name="vaccines" className="text-[18px]" />
              </span>
            </div>
            <div className="my-space-xs">
              <span className="font-metric-num text-metric-num text-on-surface font-bold">164 Certified</span>
            </div>
            <div className="flex flex-col gap-0.5 pt-space-xs text-on-surface-variant font-body-sm text-body-sm">
              <span className="text-secondary font-medium">NAFDAC Verified Registry</span>
              <span className="text-[11px] text-outline">0 Banned Actives · Strict PHI/REI</span>
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Multilingual Strings</span>
              <span className="w-7 h-7 rounded bg-surface-container-low flex items-center justify-center text-primary">
                <Icon name="translate" className="text-[18px]" />
              </span>
            </div>
            <div className="my-space-xs">
              <span className="font-metric-num text-metric-num text-on-surface font-bold">4,820</span>
            </div>
            <div className="flex flex-col gap-0.5 pt-space-xs text-on-surface-variant font-body-sm text-body-sm">
              <span className="text-secondary font-medium">99.4% Yorùbá Verified</span>
              <span className="text-[11px] text-outline">92.1% Pidgin Audio Prompts</span>
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">AI Grounding Vector Base</span>
              <span className="w-7 h-7 rounded bg-surface-container-low flex items-center justify-center text-primary">
                <Icon name="psychology" className="text-[18px]" />
              </span>
            </div>
            <div className="my-space-xs">
              <span className="font-metric-num text-metric-num text-on-surface font-bold">1,280 Q&amp;As</span>
            </div>
            <div className="flex flex-col gap-0.5 pt-space-xs text-on-surface-variant font-body-sm text-body-sm">
              <span className="text-secondary font-medium">80% Agronomist Precision</span>
              <span className="text-[11px] text-outline">0 Unapproved Chem Prescriptions</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden flex flex-col">
          <div className="p-space-lg bg-surface-container-low/70 flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-primary text-on-primary font-label-sm text-label-sm uppercase">Active Spec v3.2</span>
                <h2 className="font-headline-md text-headline-md text-primary font-bold">Maize (Zea mays) — Derived Savanna (Oke-Ogun / Oyo North) Early-Rains Standard v3.2</h2>
              </div>
              <div className="text-on-surface-variant font-body-sm text-body-sm flex items-center gap-2 flex-wrap pt-0.5">
                <span><strong className="text-on-surface">Principal Reviewer:</strong> Dr. Quadri Olapade (Lead Agronomist)</span>
                <span>·</span>
                <span><strong className="text-on-surface">Authority:</strong> IITA Maize Improvement Program &amp; NIHORT Joint Advisory</span>
                <span>·</span>
                <span><strong className="text-secondary font-semibold">Effective Cycle:</strong> Early Rains 2026</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsRollbackOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md hover:bg-surface-container shadow-sm flex items-center gap-1.5"
                type="button"
              >
                <Icon name="history" className="text-[16px]" />
                <span>Rollback Diff</span>
              </button>
              <button
                onClick={() => {
                  showScreenToast("Stage Matrix saved with SHA-256 state stamp: #0x9b82..f04e");
                }}
                className="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container shadow-sm flex items-center gap-1.5"
                type="button"
              >
                <Icon name="save" className="text-[16px]" />
                <span>Save Stage Matrix</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 px-space-lg bg-surface-container-low border-b-0 overflow-x-auto text-on-surface-variant">
            {[
              { id: "phenology", label: "Phenology & Stages (6)", icon: "timeline" },
              { id: "nutrients", label: "Nutrient & Fertilizer Split", icon: "water_drop" },
              { id: "spray", label: "Spray & Crop Protection", icon: "pest_control" },
              { id: "yoruba", label: "Yorùbá Localization", icon: "language" },
              { id: "audit", label: "Audit History", icon: "manage_history" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 font-label-md text-label-md rounded-t-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? "font-bold text-primary border-b-2 border-primary bg-surface-container-lowest"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/50"
                }`}
                type="button"
              >
                <Icon name={tab.icon as any} className="text-[18px]" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="mx-space-lg mt-space-md p-space-sm rounded-lg bg-surface-container-high/60 flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-on-secondary shrink-0">
                <Icon name="shield" className="text-[14px]" />
              </div>
              <p className="font-body-sm text-body-sm text-on-surface">
                <strong className="font-semibold text-primary">Safety Enforcement Active:</strong> Custom standards exceeding 2x recommended Nitrogen (&gt;240 kg N/Ha) or applying unregistered neonicotinoid pesticides trigger mandatory agronomist escalation.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-secondary-container text-on-secondary-container font-semibold whitespace-nowrap">RULE-SAFE-771 ON</span>
          </div>

          {activeTab === "phenology" && (
            <div className="p-space-lg overflow-x-auto">
              <div className="flex flex-col gap-space-sm">
                <div className="p-space-md rounded-lg bg-surface hover:bg-surface-container-low transition-colors flex flex-col md:flex-row md:items-start justify-between gap-space-md">
                  <div className="flex items-start gap-space-sm">
                    <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex flex-col items-center justify-center shrink-0">
                      <span className="font-label-sm text-label-sm font-bold leading-none">01</span>
                      <span className="text-[9px] uppercase font-mono mt-0.5">Prep</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">Stage 1: Land Prep &amp; Basal Dressing</h3>
                        <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono text-label-sm font-semibold">Days -14 to 0</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Deep plowing (25–30 cm target depth), harrow to friable tilth. Apply basal <strong className="text-on-surface">NPK 15-15-15 at 200 kg/Ha (4 bags)</strong> thoroughly banded. Apply pre-emergence <strong className="text-on-surface">Atrazine 500 SC @ 3.0 L/Ha</strong> within 24h of moist planting.</p>
                      <div className="flex items-center gap-3 mt-2 text-xs font-mono text-on-surface-variant">
                        <span>Moisture Min: <strong>60% Field Cap</strong></span>
                        <span>·</span>
                        <span>Herbicide: <strong>Atrazine 500 SC</strong></span>
                        <span>·</span>
                        <span>Labor: <strong>Tractor Rig / Knapsack</strong></span>
                      </div>
                    </div>
                  </div>
                  <div className="flex md:flex-col items-end gap-1 shrink-0">
                    <span className="px-2 py-1 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold">Validated IITA</span>
                    <span className="text-[11px] text-outline font-mono">Telemetry Key: #PHEN_LP_01</span>
                  </div>
                </div>

                <div className="p-space-md rounded-lg bg-surface hover:bg-surface-container-low transition-colors flex flex-col md:flex-row md:items-start justify-between gap-space-md">
                  <div className="flex items-start gap-space-sm">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-highest text-primary flex flex-col items-center justify-center shrink-0">
                      <span className="font-label-sm text-label-sm font-bold leading-none">02</span>
                      <span className="text-[9px] uppercase font-mono mt-0.5">V3-V4</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">Stage 2: Emergence &amp; Vegetative V3-V4</h3>
                        <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono text-label-sm font-semibold">Days 7 to 21</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Gap filling &amp; thinning to single seedling per stand (target 53,333 plants/Ha). First top-dress with <strong className="text-on-surface">Urea (46% N) at 100 kg/Ha</strong> side-dressed 5-8 cm away from stalk. Initiate early Fall Armyworm monitoring threshold (&gt;5% leaf windowing damage).</p>
                      <div className="flex items-center gap-3 mt-2 text-xs font-mono text-on-surface-variant">
                        <span>Pest Alert: <strong>Spodoptera frugiperda</strong></span>
                        <span>·</span>
                        <span>N split: <strong>46 kg N/Ha</strong></span>
                        <span>·</span>
                        <span>Bio-Scouting: <strong>Twice Weekly</strong></span>
                      </div>
                    </div>
                  </div>
                  <div className="flex md:flex-col items-end gap-1 shrink-0">
                    <span className="px-2 py-1 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold">Field Verified</span>
                    <span className="text-[11px] text-outline font-mono">Telemetry Key: #PHEN_VG_02</span>
                  </div>
                </div>

                <div className="p-space-md rounded-lg bg-surface hover:bg-surface-container-low transition-colors flex flex-col md:flex-row md:items-start justify-between gap-space-md">
                  <div className="flex items-start gap-space-sm">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-highest text-primary flex flex-col items-center justify-center shrink-0">
                      <span className="font-label-sm text-label-sm font-bold leading-none">03</span>
                      <span className="text-[9px] uppercase font-mono mt-0.5">V6-V8</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">Stage 3: Rapid Vegetative &amp; Knee-High V6-V8</h3>
                        <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono text-label-sm font-semibold">Days 28 to 42</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Second split application of <strong className="text-on-surface">Urea at 50 kg/Ha</strong> prior to canopy closure. Selective post-emergence broadleaf and annual grass control with <strong className="text-on-surface">Nicosulfuron + 2,4-D amine</strong> directed spray if weed density &gt;15%.</p>
                      <div className="flex items-center gap-3 mt-2 text-xs font-mono text-on-surface-variant">
                        <span>Canopy Closure: <strong>Expected D38</strong></span>
                        <span>·</span>
                        <span>Herbicide: <strong>Nicosulfuron (Selective)</strong></span>
                        <span>·</span>
                        <span>Ear Formation Prep</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex md:flex-col items-end gap-1 shrink-0">
                    <span className="px-2 py-1 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold">Field Verified</span>
                    <span className="text-[11px] text-outline font-mono">Telemetry Key: #PHEN_VG_03</span>
                  </div>
                </div>

                <div className="p-space-md rounded-lg bg-surface hover:bg-surface-container-low transition-colors flex flex-col md:flex-row md:items-start justify-between gap-space-md">
                  <div className="flex items-start gap-space-sm">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-highest text-primary flex flex-col items-center justify-center shrink-0">
                      <span className="font-label-sm text-label-sm font-bold leading-none">04</span>
                      <span className="text-[9px] uppercase font-mono mt-0.5">R1</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">Stage 4: Tasseling &amp; Silking R1</h3>
                        <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono text-label-sm font-semibold">Days 50 to 65</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Moisture stress critical period. Prevent water stress at all costs to avert ovule abortion. Prophylactic fungicide application of <strong className="text-on-surface">Azoxystrobin + Difenoconazole</strong> if relative humidity &gt;85% to halt Southern Corn Leaf Blight (Bipolaris maydis).</p>
                      <div className="flex items-center gap-3 mt-2 text-xs font-mono text-on-surface-variant">
                        <span>Critical Moisture: <strong>High Sensitivity</strong></span>
                        <span>·</span>
                        <span>Fungicide: <strong>Azoxystrobin Mix</strong></span>
                        <span>·</span>
                        <span>Tassel Pollen Window: <strong>5-7 Days</strong></span>
                      </div>
                    </div>
                  </div>
                  <div className="flex md:flex-col items-end gap-1 shrink-0">
                    <span className="px-2 py-1 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold">Strict Guardrail</span>
                    <span className="text-[11px] text-outline font-mono">Telemetry Key: #PHEN_RP_04</span>
                  </div>
                </div>

                <div className="p-space-md rounded-lg bg-surface hover:bg-surface-container-low transition-colors flex flex-col md:flex-row md:items-start justify-between gap-space-md">
                  <div className="flex items-start gap-space-sm">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-highest text-primary flex flex-col items-center justify-center shrink-0">
                      <span className="font-label-sm text-label-sm font-bold leading-none">05</span>
                      <span className="text-[9px] uppercase font-mono mt-0.5">R4-R5</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">Stage 5: Grain Filling &amp; Dent R4-R5</h3>
                        <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono text-label-sm font-semibold">Days 70 to 95</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Dough stage progressing to dent line migration. All systemic pesticide applications terminate. <strong className="text-on-surface">Pre-Harvest Interval (PHI) strictly enforced 28 days</strong> before manual cob snapping or mechanical combine operations.</p>
                      <div className="flex items-center gap-3 mt-2 text-xs font-mono text-on-surface-variant">
                        <span>Pesticide Ban: <strong>Active PHI Window</strong></span>
                        <span>·</span>
                        <span>Kernel Milk Line: <strong>50% Check</strong></span>
                        <span>·</span>
                        <span>Lodging Surveillance</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex md:flex-col items-end gap-1 shrink-0">
                    <span className="px-2 py-1 rounded bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm font-semibold">Zero Chem Spray</span>
                    <span className="text-[11px] text-outline font-mono">Telemetry Key: #PHEN_RP_05</span>
                  </div>
                </div>

                <div className="p-space-md rounded-lg bg-surface hover:bg-surface-container-low transition-colors flex flex-col md:flex-row md:items-start justify-between gap-space-md">
                  <div className="flex items-start gap-space-sm">
                    <div className="w-10 h-10 rounded-lg bg-primary text-on-primary flex flex-col items-center justify-center shrink-0">
                      <span className="font-label-sm text-label-sm font-bold leading-none">06</span>
                      <span className="text-[9px] uppercase font-mono mt-0.5">R6</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">Stage 6: Physiological Maturity &amp; Harvest R6</h3>
                        <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono text-label-sm font-semibold">Days 105 to 120</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Black layer visible at base of kernel indicating physiological maturity. Target kernel field moisture <strong className="text-on-surface">14–15%</strong> before sheller threshing. Expected savanna yield benchmark: <strong className="text-on-surface">4.2 – 6.5 MT/Ha</strong> with certified SAMMAZ hybrid seed.</p>
                      <div className="flex items-center gap-3 mt-2 text-xs font-mono text-on-surface-variant">
                        <span>Moisture Goal: <strong>14.0% Max</strong></span>
                        <span>·</span>
                        <span>Expected Yield: <strong>4.2-6.5 MT/Ha</strong></span>
                        <span>·</span>
                        <span>Aflatoxin Control Protocol</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex md:flex-col items-end gap-1 shrink-0">
                    <span className="px-2 py-1 rounded bg-secondary text-on-secondary font-label-sm text-label-sm font-semibold">Final Standard</span>
                    <span className="text-[11px] text-outline font-mono">Telemetry Key: #PHEN_HV_06</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "nutrients" && (
            <div className="p-space-lg space-y-4 text-sm">
              <div className="p-4 rounded-xl bg-surface-container-low space-y-2">
                <h3 className="font-bold text-primary text-base">Nutrient Split Application Protocol (Savanna Maize)</h3>
                <p className="text-on-surface-variant">Recommended total Nitrogen: 120 kg N/Ha. Basal dressing supplies 30 kg N/Ha via NPK 15-15-15, followed by two 45 kg N splits via Urea at V4 and V8 vegetative stages.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-surface border border-outline/10">
                  <div className="font-bold text-on-surface">Basal Planting (D0)</div>
                  <div className="text-xs text-on-surface-variant mt-1">NPK 15:15:15 @ 200 kg/Ha</div>
                  <div className="text-xs font-semibold text-secondary mt-2">Supplies N, P, K &amp; Sulfur</div>
                </div>
                <div className="p-3 rounded-lg bg-surface border border-outline/10">
                  <div className="font-bold text-on-surface">First Top-Dress (D21)</div>
                  <div className="text-xs text-on-surface-variant mt-1">Urea 46% N @ 100 kg/Ha</div>
                  <div className="text-xs font-semibold text-secondary mt-2">Accelerates Vegetative Growth</div>
                </div>
                <div className="p-3 rounded-lg bg-surface border border-outline/10">
                  <div className="font-bold text-on-surface">Second Top-Dress (D38)</div>
                  <div className="text-xs text-on-surface-variant mt-1">Urea 46% N @ 50 kg/Ha</div>
                  <div className="text-xs font-semibold text-secondary mt-2">Pre-Tasseling Ear Fill</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "spray" && (
            <div className="p-space-lg space-y-4 text-sm">
              <div className="p-4 rounded-xl bg-surface-container-low space-y-2">
                <h3 className="font-bold text-primary text-base">Crop Protection &amp; PHI Strict Enforcement</h3>
                <p className="text-on-surface-variant">Mandatory re-entry interval (REI) of 24h for knapsack herbicide spraying. Zero pyrethroid or organophosphate sprays permitted within 28 days of ear harvest.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-surface border border-outline/10">
                  <div className="font-bold text-on-surface">Fall Armyworm (FAW) Protocol</div>
                  <div className="text-xs text-on-surface-variant mt-1">Emamectin benzoate (5% WDG) @ 250 g/Ha. Rotate with Chlorantraniliprole to avert pesticide resistance.</div>
                </div>
                <div className="p-3 rounded-lg bg-surface border border-outline/10">
                  <div className="font-bold text-on-surface">Weed Management Matrix</div>
                  <div className="text-xs text-on-surface-variant mt-1">Pre-emergence Atrazine (3.0 L/Ha) followed by targeted Nicosulfuron (1.5 L/Ha) at V4 stage.</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "yoruba" && (
            <div className="p-space-lg space-y-3">
              <div className="p-3 rounded-lg bg-surface flex items-start justify-between gap-3">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-label-md text-label-md text-on-surface font-bold">Fall Armyworm Alert</span>
                    <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-[10px] text-on-surface-variant uppercase font-mono">Pest</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1 text-primary">
                    <span className="text-xs font-bold font-mono text-outline">YOR:</span>
                    <span className="font-body-md text-body-md font-semibold">Kòkòrò Apẹẹrẹ / Kòkòrò Abanijẹ Àgbàdo</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">Scouting prompt: Ṣayẹwo àwọn ewé tó ní iho tàbí ìdọ̀tí kòkòrò lórí rẹ̀.</p>
                </div>
                <button
                  onClick={() => playAudioPrompt("Fall Armyworm Alert", "Kòkòrò Apẹẹrẹ")}
                  className="shrink-0 p-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-primary transition-colors flex items-center gap-1 text-xs font-semibold"
                  title="Listen to 12s voice guidance"
                  type="button"
                >
                  <Icon name="volume_up" className="text-[16px]" />
                  <span>12s</span>
                </button>
              </div>

              <div className="p-3 rounded-lg bg-surface flex items-start justify-between gap-3">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-label-md text-label-md text-on-surface font-bold">Split Fertilizer Dressing</span>
                    <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-[10px] text-on-surface-variant uppercase font-mono">Fertility</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1 text-primary">
                    <span className="text-xs font-bold font-mono text-outline">YOR:</span>
                    <span className="font-body-md text-body-md font-semibold">Ìdáṣe Ajílẹ̀ sí Ìpele Kejì (Gbígbẹ Ajílẹ̀ lẹ́gbẹ̀ẹ́)</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">Application prompt: Má ṣe da ajílẹ̀ sí orí ewé, gbé e sí ẹ̀gbẹ́ gbòǹgbò ní ìwọ̀n ìka méjì.</p>
                </div>
                <button
                  onClick={() => playAudioPrompt("Split Fertilizer Dressing", "Ìdáṣe Ajílẹ̀ sí Ìpele Kejì")}
                  className="shrink-0 p-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-primary transition-colors flex items-center gap-1 text-xs font-semibold"
                  title="Listen to audio prompt"
                  type="button"
                >
                  <Icon name="volume_up" className="text-[16px]" />
                  <span>Audio</span>
                </button>
              </div>

              <div className="p-3 rounded-lg bg-surface flex items-start justify-between gap-3">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-label-md text-label-md text-on-surface font-bold">Pre-Harvest Interval (PHI)</span>
                    <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-[10px] text-on-surface-variant uppercase font-mono">Safety</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1 text-primary">
                    <span className="text-xs font-bold font-mono text-outline">YOR:</span>
                    <span className="font-body-md text-body-md font-semibold">Àkókò Ìdúró Kí a Tó Kórè (Àkókò Ẹ̀jẹ̀ Oògùn)</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">Safety notice: Ẹ̀jẹ̀ oògùn gbọ́dọ̀ tán kí ènìyàn tó kórè tàbí jẹ oúnjẹ náà.</p>
                </div>
                <button
                  onClick={() => playAudioPrompt("Pre-Harvest Interval", "Àkókò Ìdúró Kí a Tó Kórè")}
                  className="shrink-0 p-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-primary transition-colors flex items-center gap-1 text-xs font-semibold"
                  title="Listen to audio prompt"
                  type="button"
                >
                  <Icon name="volume_up" className="text-[16px]" />
                  <span>Audio</span>
                </button>
              </div>

              <div className="p-3 rounded-lg bg-surface flex items-start justify-between gap-3">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-label-md text-label-md text-on-surface font-bold">Soil Moisture Deficit</span>
                    <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-[10px] text-on-surface-variant uppercase font-mono">Weather</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1 text-primary">
                    <span className="text-xs font-bold font-mono text-outline">YOR:</span>
                    <span className="font-body-md text-body-md font-semibold">Àìtó Omi Nínú Ilẹ̀ Ní Àkókò Ìtànná</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">Drought caution: Bí ilẹ̀ bá gbẹ ní àkókò ìtànná, àgbàdo kò ní kún dáadáa.</p>
                </div>
                <button
                  onClick={() => playAudioPrompt("Soil Moisture Deficit", "Àìtó Omi Nínú Ilẹ̀")}
                  className="shrink-0 p-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-primary transition-colors flex items-center gap-1 text-xs font-semibold"
                  title="Listen to audio prompt"
                  type="button"
                >
                  <Icon name="volume_up" className="text-[16px]" />
                  <span>Audio</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="p-space-lg space-y-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-surface space-y-1">
                <div className="flex justify-between text-on-surface-variant">
                  <span>2026-03-29 11:22 WAT</span>
                  <span className="text-secondary font-bold">STATE HASH: 0x9b82..f04e</span>
                </div>
                <div className="font-bold text-on-surface">Revision v3.2 Published by Dr. Quadri Olapade</div>
                <div className="text-on-surface-variant">Calibrated with IITA Derived Savanna Trials (Saki &amp; Iseyin blocks).</div>
              </div>
              <div className="p-3 rounded-lg bg-surface space-y-1">
                <div className="flex justify-between text-on-surface-variant">
                  <span>2026-02-14 09:15 WAT</span>
                  <span className="text-secondary font-bold">STATE HASH: 0x7a11..bc90</span>
                </div>
                <div className="font-bold text-on-surface">Revision v3.1 Published by Dr. K. Alabi</div>
                <div className="text-on-surface-variant">Initial early-rains basal fertilizer calibration.</div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-surface-container-lowest shadow-sm p-space-lg flex flex-col gap-space-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
            <div className="flex flex-col gap-0.5">
              <h2 className="font-headline-md text-headline-md text-primary font-bold">NAFDAC Certified Input Registry &amp; Safety Formulations</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Live repository of certified agronomic compounds, pre-harvest safety thresholds, and operator re-entry parameters for South-West Nigeria field operations.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddChemicalOpen(true)}
                className="px-3 py-1.5 rounded bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary-container transition-colors flex items-center gap-1"
                type="button"
              >
                <Icon name="add" className="text-[16px]" />
                <span>Add Agrochemical</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                  <th className="py-2.5 px-3">Formulation &amp; Trade Name</th>
                  <th className="py-2.5 px-3">NAFDAC Reg No.</th>
                  <th className="py-2.5 px-3">Manufacturer / Formulator</th>
                  <th className="py-2.5 px-3">Active Composition</th>
                  <th className="py-2.5 px-3">Prescribed Rate</th>
                  <th className="py-2.5 px-3">REI / PHI Interval</th>
                  <th className="py-2.5 px-3">Toxicity Class</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="text-on-surface">
                <tr className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">NPK 15:15:15 (Golden Fertilizer)</span>
                      <span className="text-xs text-on-surface-variant">Granular Inorganic Fertilizer</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs font-semibold">A5-0182</td>
                  <td className="py-3 px-3">Notore Chemical Ind. Plc</td>
                  <td className="py-3 px-3 font-mono text-xs">N:15% · P₂O₅:15% · K₂O:15%</td>
                  <td className="py-3 px-3 font-medium">200 kg / Ha (Basal)</td>
                  <td className="py-3 px-3">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant text-[11px] font-mono">REI: Immediate</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary"><span className="w-2 h-2 rounded-full bg-secondary" /> Non-Toxic (Fertilizer)</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">Approved</span>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">Atrazine 500 SC (Force-Up)</span>
                      <span className="text-xs text-on-surface-variant">Selective Pre-emergence Herbicide</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs font-semibold">A5-0442</td>
                  <td className="py-3 px-3">Jubaili Agrotec Nigeria Ltd</td>
                  <td className="py-3 px-3 font-mono text-xs">Atrazine 500 g/L</td>
                  <td className="py-3 px-3 font-medium">3.0 L / Ha in 200L H₂O</td>
                  <td className="py-3 px-3">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant text-[11px] font-mono">REI: 24h / PHI: 45d</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary"><span className="w-2 h-2 rounded-full bg-primary" /> Class III (Caution)</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">Approved</span>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">Emamectin 5% WDG (Proclaim Safe)</span>
                      <span className="text-xs text-on-surface-variant">Bio-rational Ingestion Insecticide</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs font-semibold">A5-1108</td>
                  <td className="py-3 px-3">Syngenta Nigeria / C. Zard</td>
                  <td className="py-3 px-3 font-mono text-xs">Emamectin benzoate 50 g/kg</td>
                  <td className="py-3 px-3 font-medium">250 g / Ha (Knapsack)</td>
                  <td className="py-3 px-3">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant text-[11px] font-mono">REI: 12h / PHI: 14d</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary"><span className="w-2 h-2 rounded-full bg-secondary" /> Class III (Bio-rational)</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">Approved</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
          <div className="lg:col-span-7 rounded-xl bg-surface-container-lowest shadow-sm p-space-lg flex flex-col justify-between gap-space-md">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Multilingual Voice &amp; Knowledge Base Studio</h3>
                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">Yorùbá &amp; Pidgin Active</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Ground-truth verified translations of agronomic warnings, pest protocols, and fertilizer timing for smallholder field extension workers.</p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsTranslationStudioOpen(true)}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
                type="button"
              >
                <span>Manage Translation Studio</span>
                <Icon name="arrow_forward" className="text-[14px]" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-space-md">
            <div className="rounded-xl bg-surface-container-lowest shadow-sm p-space-lg flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Standard Review Queue</h3>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold">
                  {reviewQueue.filter((q) => q.status === "In Review").length} Pending
                </span>
              </div>
              <div className="flex flex-col gap-space-xs mt-1">
                {reviewQueue.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg bg-surface flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="font-mono text-[11px] text-primary font-bold">{item.id}</span>
                        <h4 className="font-label-md text-label-md text-on-surface font-semibold">{item.title}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded font-label-sm text-label-sm whitespace-nowrap ${
                        item.status === "In Review" ? "bg-surface-container text-on-surface" : "bg-secondary-container text-on-secondary-container font-semibold"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">Submitted by <strong className="text-on-surface">{item.submittedBy}</strong> · {item.appraiser}.</p>
                    {item.status === "In Review" && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => setReviewDiffItem(item)}
                          className="px-2.5 py-1 rounded bg-surface-container-lowest text-primary text-xs font-semibold hover:bg-surface-container shadow-sm"
                          type="button"
                        >
                          Review Diff
                        </button>
                        <button
                          onClick={() => {
                            setReviewQueue((prev) =>
                              prev.map((q) => (q.id === item.id ? { ...q, status: "Approved & Published v1.0" } : q))
                            );
                            showScreenToast(`Approved & Published standard: ${item.title}`);
                          }}
                          className="px-2.5 py-1 rounded bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container shadow-sm"
                          type="button"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setReviewQueue((prev) =>
                              prev.map((q) => (q.id === item.id ? { ...q, status: "Rejected - Revision Required" } : q))
                            );
                            showScreenToast(`Rejected standard proposal: ${item.title}`);
                          }}
                          className="px-2.5 py-1 rounded bg-error-container text-on-error-container text-xs font-semibold hover:bg-error/20"
                          type="button"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* MODAL 1: Create New Standard Draft */}
        {isCreateDraftOpen && (
          <ScreenDialog
            title="Create New Agronomic Standard Draft"
            subtitle="Author calibrated phenology stages and agrochemical guidelines"
            onClose={() => setIsCreateDraftOpen(false)}
            panel={
              <form onSubmit={handleCreateDraft} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">Standard Title</label>
                  <input
                    type="text"
                    required
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder="e.g. Soya (Glycine max) — Rainforest Belt Late-Rains Standard v1.0"
                    className="w-full p-2.5 rounded-lg border border-outline bg-surface-container-low text-xs text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">Target Crop Variety</label>
                    <select
                      value={draftCrop}
                      onChange={(e) => setDraftCrop(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-outline bg-surface-container-low text-xs text-on-surface focus:border-primary focus:outline-none"
                    >
                      <option value="Maize (Zea mays)">Maize (Zea mays)</option>
                      <option value="Cassava (Manihot esculenta)">Cassava (Manihot esculenta)</option>
                      <option value="Soybean (Glycine max)">Soybean (Glycine max)</option>
                      <option value="Rice (Oryza sativa)">Rice (Oryza sativa)</option>
                      <option value="Tomato (Solanum lycopersicum)">Tomato (Solanum lycopersicum)</option>
                      <option value="Cowpea (Vigna unguiculata)">Cowpea (Vigna unguiculata)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">Agro-Ecological Zone</label>
                    <select
                      value={draftZone}
                      onChange={(e) => setDraftZone(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-outline bg-surface-container-low text-xs text-on-surface focus:border-primary focus:outline-none"
                    >
                      <option value="Derived Savanna (Oke-Ogun / Oyo North)">Derived Savanna (Oke-Ogun / Oyo North)</option>
                      <option value="Humid Rainforest (Ondo / Ogun South)">Humid Rainforest (Ondo / Ogun South)</option>
                      <option value="Southern Guinea Savanna (Kwara / Niger Transition)">Southern Guinea Savanna (Transition)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">Collaborating Research Institute</label>
                    <select
                      value={draftInstitute}
                      onChange={(e) => setDraftInstitute(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-outline bg-surface-container-low text-xs text-on-surface focus:border-primary focus:outline-none"
                    >
                      <option value="IITA Maize Improvement Program">IITA Maize Improvement Program</option>
                      <option value="NIHORT Horticultural Advisory">NIHORT Horticultural Advisory</option>
                      <option value="NCRI Badeggi Cereals Division">NCRI Badeggi Cereals Division</option>
                      <option value="CRIN Cocoa & Cashew Institute">CRIN Cocoa &amp; Cashew Institute</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">Target Harvest Benchmark</label>
                    <input
                      type="text"
                      required
                      value={draftYield}
                      onChange={(e) => setDraftYield(e.target.value)}
                      placeholder="e.g. 5.5 MT/Ha"
                      className="w-full p-2.5 rounded-lg border border-outline bg-surface-container-low text-xs text-on-surface focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <ScreenDialogClose onClick={() => setIsCreateDraftOpen(false)}>
                    Cancel
                  </ScreenDialogClose>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold text-xs hover:bg-primary-container"
                  >
                    Save Standard Draft
                  </button>
                </div>
              </form>
            }
          />
        )}

        {/* MODAL 2: Publish Revisions */}
        {isPublishRevisionsOpen && (
          <ScreenDialog
            title="Publish Approved Revisions to Field Edge Mesh"
            subtitle="Broadcast updated standards to PowerSync offline databases across all extension tablets"
            onClose={() => setIsPublishRevisionsOpen(false)}
            panel={
              <div className="space-y-3 text-sm">
                <div className="p-3 rounded-lg bg-surface-container-low space-y-1 text-xs">
                  <div><strong>Target Nodes:</strong> 124 Registered Agronomists &amp; Extension Officers</div>
                  <div><strong>State Synchronization:</strong> SHA-256 Merkle root recalculation</div>
                  <div><strong>Pilot Crops Updated:</strong> Maize v3.2, Cassava v2.1</div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <ScreenDialogClose onClick={() => setIsPublishRevisionsOpen(false)}>
                    Cancel
                  </ScreenDialogClose>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPublishRevisionsOpen(false);
                      showScreenToast("Successfully published approved agronomic standards to all 124 field edge tablets.");
                    }}
                    className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold text-xs hover:bg-primary-container"
                  >
                    Confirm &amp; Broadcast Revisions
                  </button>
                </div>
              </div>
            }
          />
        )}

        {/* MODAL 3: Rollback Diff */}
        {isRollbackOpen && (
          <ScreenDialog
            title="Rollback Diff Comparison: Maize v3.2 vs v3.1"
            subtitle="Review parameter differences before applying historical state restore"
            onClose={() => setIsRollbackOpen(false)}
            panel={
              <div className="space-y-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-surface-container-low space-y-2">
                  <div className="text-secondary font-bold">Line 14: Urea Top-Dress Timing</div>
                  <div className="text-error">- Days 14 to 28: 150 kg/Ha single application</div>
                  <div className="text-secondary">+ Days 7 to 21 (V4): 100 kg/Ha split + Days 28 to 42 (V8): 50 kg/Ha split</div>
                  <div className="border-t border-outline/10 pt-2 text-on-surface-variant font-sans">
                    Rationale: 2-split Urea application reduces leaching losses by 34% under heavy Savanna thunderstorm events.
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <ScreenDialogClose onClick={() => setIsRollbackOpen(false)}>
                    Close
                  </ScreenDialogClose>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRollbackOpen(false);
                      showScreenToast("Kept current optimized split schedule v3.2.");
                    }}
                    className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-sans font-semibold hover:bg-primary-container"
                  >
                    Retain Current v3.2
                  </button>
                </div>
              </div>
            }
          />
        )}

        {/* MODAL 4: Add Agrochemical */}
        {isAddChemicalOpen && (
          <ScreenDialog
            title="Register NAFDAC Certified Agrochemical"
            subtitle="Add approved fertilizer, bio-rational insecticide, or selective herbicide"
            onClose={() => setIsAddChemicalOpen(false)}
            panel={
              <form onSubmit={handleAddChemical} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Trade Formulation Name</label>
                  <input
                    type="text"
                    required
                    value={chemName}
                    onChange={(e) => setChemName(e.target.value)}
                    placeholder="e.g. Chlorantraniliprole 20% SC (Coragen)"
                    className="w-full p-2 rounded border border-outline bg-surface-container-low text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-bold text-on-surface">NAFDAC Reg No.</label>
                    <input
                      type="text"
                      required
                      value={chemNafdac}
                      onChange={(e) => setChemNafdac(e.target.value)}
                      placeholder="e.g. A5-0992"
                      className="w-full p-2 rounded border border-outline bg-surface-container-low text-on-surface focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-on-surface">Manufacturer / Importer</label>
                    <input
                      type="text"
                      required
                      value={chemMaker}
                      onChange={(e) => setChemMaker(e.target.value)}
                      placeholder="e.g. FMC Agricultural Solutions"
                      className="w-full p-2 rounded border border-outline bg-surface-container-low text-on-surface focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-bold text-on-surface">Active Composition</label>
                    <input
                      type="text"
                      required
                      value={chemActive}
                      onChange={(e) => setChemActive(e.target.value)}
                      placeholder="e.g. Chlorantraniliprole 200 g/L"
                      className="w-full p-2 rounded border border-outline bg-surface-container-low text-on-surface focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-on-surface">Prescribed Application Rate</label>
                    <input
                      type="text"
                      required
                      value={chemRate}
                      onChange={(e) => setChemRate(e.target.value)}
                      placeholder="e.g. 150 ml / Ha"
                      className="w-full p-2 rounded border border-outline bg-surface-container-low text-on-surface focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Pre-Harvest Interval (PHI)</label>
                  <input
                    type="text"
                    required
                    value={chemPhi}
                    onChange={(e) => setChemPhi(e.target.value)}
                    placeholder="e.g. 14 Days"
                    className="w-full p-2 rounded border border-outline bg-surface-container-low text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <ScreenDialogClose onClick={() => setIsAddChemicalOpen(false)}>
                    Cancel
                  </ScreenDialogClose>
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-lg bg-primary text-on-primary font-semibold hover:bg-primary-container"
                  >
                    Register Formulation
                  </button>
                </div>
              </form>
            }
          />
        )}

        {/* MODAL 5: Translation Studio */}
        {isTranslationStudioOpen && (
          <ScreenDialog
            title="Multilingual Translation Studio"
            subtitle="Manage Yorùbá diacritics and Nigerian Pidgin audio voiceovers"
            onClose={() => setIsTranslationStudioOpen(false)}
            panel={
              <div className="space-y-3 text-xs">
                <p className="text-on-surface-variant">
                  CultivaNode voice engines utilize tonal Yorùbá synthesis with accurate tone marking (àmi ohùn) to ensure smallholder farmers in rural Oyo, Ogun, and Osun clearly comprehend safety warnings.
                </p>
                <div className="p-3 rounded-lg bg-surface-container-low space-y-1 font-mono">
                  <div><strong>Total Active Phrases:</strong> 4,820</div>
                  <div><strong>Tone-Checked Accuracy:</strong> 99.4%</div>
                  <div><strong>AMR-WB 16kHz Audio Cache:</strong> 4,440 clips ready</div>
                </div>
                <div className="flex justify-end pt-2">
                  <ScreenDialogClose onClick={() => setIsTranslationStudioOpen(false)}>
                    Close Studio
                  </ScreenDialogClose>
                </div>
              </div>
            }
          />
        )}

        {/* MODAL 6: Review Diff for Item */}
        {reviewDiffItem && (
          <ScreenDialog
            title={`Review Diff: ${reviewDiffItem.id}`}
            subtitle={reviewDiffItem.title}
            onClose={() => setReviewDiffItem(null)}
            panel={
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-surface-container-low space-y-1 font-mono">
                  <div><strong>Submission Ref:</strong> {reviewDiffItem.id}</div>
                  <div><strong>Author:</strong> {reviewDiffItem.submittedBy}</div>
                  <div><strong>Appraisal:</strong> {reviewDiffItem.appraiser}</div>
                </div>
                <div className="flex justify-end pt-2">
                  <ScreenDialogClose onClick={() => setReviewDiffItem(null)}>
                    Close
                  </ScreenDialogClose>
                </div>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
