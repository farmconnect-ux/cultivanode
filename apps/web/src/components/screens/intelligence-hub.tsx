"use client";

// Ported from the "cultivanode_intelligence_ai_farm_manager" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { useState, useRef } from "react";
import { Icon } from "@/components/ds/icon";
import { showScreenToast, ScreenDialog, ScreenDialogClose } from "@/components/ds/screen-dialog";
import { downloadFile } from "@/lib/download";
import { slot, type ScreenProps } from "./types";

export type IntelligenceHubSlot = "chat";

type Message = {
  id: string;
  sender: "user" | "ai";
  name: string;
  time: string;
  content: string;
  warning?: string;
  source?: string;
  confidence?: string;
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: "m1",
    sender: "user",
    name: "Quadri Olapade (Farm Manager)",
    time: "08:41 WAT",
    content: "How will the Friday 42mm rain affect our scheduled Split-N Urea application on Plot A1 Maize?",
  },
  {
    id: "m2",
    sender: "ai",
    name: "CultivaNode Agronomist Engine v2.4",
    time: "08:42 WAT",
    warning: "Warning: Wash-off & Leaching Risk High. Applying 12 bags Urea 46% directly prior to a 42mm torrential storm creates up to 38% surface run-off and nitrate leaching into lower furrows.",
    content: "Recommendation: Hold application until Saturday 07:00 WAT. Soil moisture saturation will peak Friday evening (~94% field capacity); applying granular Urea on moist, aerating soil Saturday morning maximizes root uptake without nitrogen volatilization or stream contamination.",
    source: "IITA Savanna Maize Agronomy Guide §4.2 · Verified against NiMet Radar Feed",
    confidence: "97.8% Confidence",
  },
];

export function IntelligenceHub({ slots }: ScreenProps<IntelligenceHubSlot>) {
  // State
  const [lang, setLang] = useState<"en" | "yo" | "pcm">("en");
  const [inputQuery, setInputQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [rescheduled, setRescheduled] = useState(false);
  const [sprayApproved, setSprayApproved] = useState(false);
  const [fansRunning, setFansRunning] = useState(false);
  const [escrowReleased, setEscrowReleased] = useState(false);
  const [mandateApproved, setMandateApproved] = useState(false);
  const [reorderDone, setReorderDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handlers
  const handleExportBriefing = () => {
    const brief = `CULTIVANODE INTELLIGENCE & AI FARM MANAGER - DAILY BRIEFING
Generated: ${new Date().toLocaleDateString("en-NG", { dateStyle: "full" })}
Ecozone: Oyo Savanna Ecological Zone (Iseyin Node)
AI Model: ResNet-Savanna v2 / IITA Savanna Extension Protocol v2026.1

--- SUMMARY STATUS ---
Diagnostic Confidence: 94.2% Mean Accuracy
Active Data Streams: Phenology, NiMet Doppler, Soil Tensiometers, Silo Telemetry, Broiler House 1, Machinery Fleet

--- CRITICAL REASONING ADVISORIES ---
1. Plot A1 (Maize): Split-N Urea application held until Saturday 07:00 WAT due to NiMet 42mm frontal storm.
2. Plot B1 (Roma Tomato): Early Blight (Alternaria solani) detected (94% confidence). PHI 14 days, Copper Hydroxide 2.5g/L recommended.
3. Broiler House 1: Ambient temperature alert (28.2°C at peak). Evaporative fan automation triggered.
4. Escrow & Finance: ₦420,000 harrowing expense reconciled. ₦95,000 operator payout cleared.

Human Confirmation Mandate: Policy §8.1.E Enforced.
`;
    downloadFile(brief, `CultivaNode-AI-Intelligence-Briefing-${new Date().toISOString().slice(0, 10)}.txt`, "text/plain");
    showScreenToast("Daily AI agronomic briefing exported successfully.");
  };

  const handleRunDiagnostic = () => {
    showScreenToast("System diagnostic running: Latency 142ms · ResNet-Savanna loss 0.041 · NiMet feed active · SQLite sync OK.");
  };

  const handleVoiceInput = () => {
    const sampleQuery =
      lang === "yo"
        ? "Báwo ni òjò ọjọ́ Friday ṣe máa kan ajílẹ̀ Urea wa lórí Plot A1?"
        : lang === "pcm"
          ? "How the heavy rain on Friday go affect our Urea fertilizer for Plot A1 maize?"
          : "What is the optimal sowing depth for SAMMAZ-52 maize in current Oyo soil moisture?";
    setInputQuery(sampleQuery);
    showScreenToast(`Voice input transcribed (${lang.toUpperCase()}): "${sampleQuery}"`);
  };

  const handleSendQuery = (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query) return;

    const userMsg: Message = {
      id: `m-${Date.now()}`,
      sender: "user",
      name: "Quadri Olapade (Farm Manager)",
      time: new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }) + " WAT",
      content: query,
    };

    let aiReply = "Agronomic inference complete: Evaluated against Oyo Savanna soil chemistry and 7-day meteorological forecast.";
    let warning: string | undefined = undefined;

    if (query.toLowerCase().includes("broiler") || query.toLowerCase().includes("feed")) {
      aiReply = "Broiler House 1 currently holds 4.2 tonnes of Starter Crumble. At current daily consumption of 165 kg/day for 1,250 birds, runway is approximately 25.4 days. Reorder point threshold is at 10 days runway.";
    } else if (query.toLowerCase().includes("cassava") || query.toLowerCase().includes("weeding")) {
      aiReply = "Simulating delayed weeding on Plot C2 (TMS 30572): A 14-day delay past V6 canopy closure allows Cynodon dactylon and Cyperus rotoundus root competition, projecting an estimated 11.8% to 14.5% fresh root yield reduction at 11-month harvest.";
      warning = "High yield loss sensitivity: Weed clearance within next 48 hours restores 98% of expected yield curve.";
    } else if (query.toLowerCase().includes("yorùbá") || query.toLowerCase().includes("translate")) {
      aiReply = "Ètò iṣẹ́ owúrọ̀ yìí: Kẹ́ ẹ da ajílẹ̀ Urea dúró fún Plot A1 títí di owúrọ̀ ọjọ́ Àbámẹ́ta (Saturday). Ẹ fún ọ̀rọ̀ oògùn Copper Hydroxide sára tòmátò Plot B1 pẹ̀lú ìbòjú àti ibọwọ́ (PPE Level 3). Ẹ tú fáànù Broiler House 1 sílẹ̀ ní agogo kan ọ̀sán.";
    } else {
      aiReply = `Reasoning based on Nigerian Agro-ecological data: Your query "${query}" has been cross-referenced with IITA and NIHORT extension protocols. Weather, soil moisture (24 cbar), and field status are within operational thresholds.`;
    }

    const aiMsg: Message = {
      id: `ai-${Date.now()}`,
      sender: "ai",
      name: "CultivaNode Core AI",
      time: new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }) + " WAT",
      content: aiReply,
      warning,
      source: "CultivaNode Agronomy KB v2.4 · Calibrated to Oyo Savanna",
      confidence: "95.6% Confidence",
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInputQuery("");
    showScreenToast("AI agronomic reasoning response generated.");
  };

  // Modals content
  const modalNewQuery = (
    <div className="flex flex-col gap-4 p-4 max-w-lg">
      <div className="flex items-center gap-2">
        <Icon name="psychology" className="text-xl text-primary" />
        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">New Agronomic Query</h3>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Submit inquiries directly to the multi-modal reasoning engine calibrated for Nigerian soils and crop phenology.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const q = fd.get("query") as string;
          if (q) handleSendQuery(q);
        }}
        className="flex flex-col gap-3"
      >
        <div>
          <label className="font-label-sm text-label-sm font-semibold text-on-surface block mb-1">Target Crop / Plot</label>
          <select name="plot" className="w-full bg-surface-container-low p-2 rounded-lg text-body-sm border border-outline-variant focus:outline-none">
            <option>Plot A1 - Maize (TZE-E-SR 95-day)</option>
            <option>Plot B1 - Roma Tomato (NIHORT Standard)</option>
            <option>Plot C2 - TMS 30572 Cassava</option>
            <option>Poultry House 1 - Broilers (1,250 birds)</option>
          </select>
        </div>
        <div>
          <label className="font-label-sm text-label-sm font-semibold text-on-surface block mb-1">Inquiry Description</label>
          <textarea
            name="query"
            rows={3}
            placeholder="e.g. Can we apply Kocide 2000 fungicide given the 88% evening humidity?"
            required
            className="w-full bg-surface-container-low p-2 rounded-lg text-body-sm border border-outline-variant focus:outline-none"
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <ScreenDialogClose>
            <button onClick={() => {}} type="button" className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md">
              Cancel
            </button>
          </ScreenDialogClose>
          <ScreenDialogClose>
            <button onClick={() => {}} type="submit" className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold">
              Submit Query
            </button>
          </ScreenDialogClose>
        </div>
      </form>
    </div>
  );

  const modalSaturationCurve = (
    <div className="flex flex-col gap-4 p-4 max-w-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="water_drop" className="text-xl text-secondary" />
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Plot A1 Soil Moisture Simulation</h3>
        </div>
        <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">
          High Leaching Risk
        </span>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        NiMet Doppler radar tracks a 42mm convective rain front arriving Friday 16:00 WAT. Granular fertilizer placed before the storm will wash off up to 38%.
      </p>
      <div className="p-3 bg-surface-container-low rounded-xl space-y-2 font-mono text-label-sm">
        <div className="flex justify-between border-b pb-1">
          <span>Thu 12:00 (Current)</span>
          <span className="text-secondary">24 cbar (Aerated)</span>
        </div>
        <div className="flex justify-between border-b pb-1">
          <span>Fri 06:00 (Pre-rain)</span>
          <span>22 cbar</span>
        </div>
        <div className="flex justify-between border-b pb-1 text-error font-bold">
          <span>Fri 18:00 (42mm Storm Peak)</span>
          <span>6 cbar (94% Field Saturation - Leaching)</span>
        </div>
        <div className="flex justify-between border-b pb-1 text-secondary font-bold">
          <span>Sat 07:00 (Target Window)</span>
          <span>16 cbar (Optimal Granular Infiltration)</span>
        </div>
        <div className="flex justify-between">
          <span>Sun 12:00</span>
          <span>19 cbar (Steady State)</span>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <ScreenDialogClose>
          <button onClick={() => {}} type="button" className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold">
            Close
          </button>
        </ScreenDialogClose>
      </div>
    </div>
  );

  const modalRulesRepository = (
    <div className="flex flex-col gap-4 p-4 max-w-2xl max-h-[80vh] overflow-y-auto">
      <div className="flex items-center gap-2">
        <Icon name="manage_search" className="text-xl text-primary" />
        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Agronomic Rule Repository (148 SOPs)</h3>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Peer-reviewed standard operating procedures codified for automated edge validation across South-West Nigeria agro-ecological zones.
      </p>
      <div className="space-y-2">
        {[
          { code: "SOP-MZ-01", title: "IITA Maize Nitrogen Split-Application Timing", rule: "Urea 46% delayed if rain forecast > 25mm in 24h", status: "Active" },
          { code: "SOP-TM-04", title: "NIHORT Tomato Early Blight (Alternaria) PHI Protocol", rule: "Minimum 14 days pre-harvest interval for Copper Hydroxide", status: "Active" },
          { code: "SOP-CS-09", title: "NCRI Cassava Stem Cutting Disinfection", rule: "Dip in 2% Mancozeb 15 mins prior to planting", status: "Active" },
          { code: "SOP-PL-02", title: "Veterinary Broiler Heat Stress Mitigation", rule: "Automate misting & fans at ambient temperature > 28°C", status: "Active" },
          { code: "SOP-WX-08", title: "NiMet Storm Weather Guardrail Policy", rule: "Halt all chemical boom spraying during wind gusts > 15 km/h", status: "Active" },
        ].map((sop) => (
          <div key={sop.code} className="p-3 bg-surface-container-low rounded-lg flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 font-label-sm text-label-sm font-bold text-primary">
                <span>{sop.code}</span>
                <span className="text-on-surface font-semibold">{sop.title}</span>
              </div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{sop.rule}</div>
            </div>
            <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold shrink-0">
              {sop.status}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={() => {
            downloadFile(
              "SOP Code,Title,Rule,Status\nSOP-MZ-01,IITA Maize Split-N,Delay if rain > 25mm,Active\nSOP-TM-04,NIHORT Tomato Early Blight,14d PHI Copper Hydroxide,Active\nSOP-CS-09,NCRI Cassava Disinfection,Dip 2% Mancozeb 15m,Active\nSOP-PL-02,Broiler Heat Stress,Fans at >28C,Active\nSOP-WX-08,NiMet Wind Guardrail,Halt boom spray >15km/h,Active",
              "CultivaNode-Agronomy-Rules-Repository.csv",
              "text/csv"
            );
            showScreenToast("SOP Repository exported to CSV.");
          }}
          type="button"
          className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md"
        >
          Export All SOPs (CSV)
        </button>
        <ScreenDialogClose>
          <button onClick={() => {}} type="button" className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold">
            Close
          </button>
        </ScreenDialogClose>
      </div>
    </div>
  );

  return (
    <div className="screen">
      <div className="flex flex-col w-full space-y-space-xl pb-16">
        <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
          <div className="flex flex-col space-y-space-xs max-w-3xl">
            <div className="flex flex-wrap items-center gap-space-sm mb-1">
              <span className="inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" /> AI Engine: Connected to Local Knowledge Base v2.4 (Oyo Savanna Protocol)
              </span>
              <span className="inline-flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                <Icon name="verified_user" className="text-sm text-secondary" /> Guardrail §8.1.E Active
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold tracking-tight">
              CultivaNode Intelligence &amp; AI Farm Manager
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Context-aware agronomical reasoning, real-time farm telemetry synthesis, multi-lingual voice &amp; diagnostic assistant
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-space-sm">
            <button
              onClick={handleExportBriefing}
              className="px-space-md py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors font-label-md text-label-md flex items-center gap-1.5"
              id="btn-export-brief"
              type="button"
            >
              <Icon name="file_download" className="text-base" /> Export Briefing
            </button>
            <button
              onClick={handleRunDiagnostic}
              className="px-space-md py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors font-label-md text-label-md flex items-center gap-1.5"
              id="btn-run-diag"
              type="button"
            >
              <Icon name="published_with_changes" className="text-base" /> Run System Diagnostic
            </button>
            <ScreenDialog title="New Query" side="center" panel={modalNewQuery}>
              <button
                onClick={() => {}}
                className="px-space-md py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-all font-label-md text-label-md flex items-center gap-1.5 shadow-sm"
                id="btn-new-query"
                type="button"
              >
                <Icon name="add_comment" className="text-base" /> New Agronomic Query
              </button>
            </ScreenDialog>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Synthesized Daily Briefing</span>
              <span className="p-1.5 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed">
                <Icon name="priority_high" className="text-lg" />
              </span>
            </div>
            <div className="my-space-sm">
              <div className="font-metric-num text-metric-num text-primary">Optimal</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">1 Critical Action Required today</p>
            </div>
            <div className="flex items-center gap-1.5 text-tertiary font-label-sm text-label-sm">
              <Icon name="schedule" className="text-sm" />
              <span>Generated 06:15 WAT • Refreshes in 42m</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Diagnostic Confidence</span>
              <span className="p-1.5 rounded-lg bg-secondary-container text-on-secondary-container">
                <Icon name="psychology" className="text-lg" />
              </span>
            </div>
            <div className="my-space-sm">
              <div className="flex items-baseline gap-2">
                <span className="font-metric-num text-metric-num text-primary">94.2%</span>
                <span className="font-label-sm text-label-sm text-secondary font-bold">Mean Acc.</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Trained on 1,400+ SW Nigeria pest/soil cases</p>
            </div>
            <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm">
              <Icon name="model_training" className="text-sm text-secondary" />
              <span>Loss 0.041 • ResNet-Savanna v2</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Cross-Module Telemetry</span>
              <span className="p-1.5 rounded-lg bg-surface-container-high text-primary">
                <Icon name="hub" className="text-lg" />
              </span>
            </div>
            <div className="my-space-sm">
              <div className="flex items-baseline gap-2">
                <span className="font-metric-num text-metric-num text-primary">6 Modules</span>
                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">Live Stream</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Phenology, NiMet, Soil, Silo, Broiler, Fleet</p>
            </div>
            <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm">
              <Icon name="wifi_tethering" className="text-sm text-secondary" />
              <span>Local Mesh Node: Iseyin-Tower-04</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Standard Benchmark</span>
              <span className="p-1.5 rounded-lg bg-primary-fixed text-on-primary-fixed">
                <Icon name="library_books" className="text-lg" />
              </span>
            </div>
            <div className="my-space-sm">
              <div className="font-headline-sm text-headline-sm text-primary font-bold">IITA &amp; NIHORT</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Savanna Extension Protocol v2026.1</p>
            </div>
            <div className="flex items-center gap-1.5 text-secondary font-label-sm text-label-sm">
              <Icon name="fact_check" className="text-sm" />
              <span>Peer-reviewed for Sub-humid Ecozone</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          <div className="lg:col-span-7 space-y-space-lg">
            {slot(
              slots,
              "chat",
              <section className="bg-surface-container-lowest rounded-xl shadow-sm flex flex-col overflow-hidden">
                <div className="p-space-md bg-surface-container-low flex flex-wrap items-center justify-between gap-space-sm">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm">
                      <Icon name="smart_toy" className="text-xl" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-headline-sm text-headline-sm text-primary font-bold">CultivaNode Core AI</h2>
                        <span className="w-2 h-2 rounded-full bg-secondary" />
                      </div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">Agronomic reasoning grounded in local soil chemistry &amp; NiMet forecast</p>
                    </div>
                  </div>
                  <div className="flex items-center bg-surface-container-lowest p-1 rounded-lg shadow-sm" id="lang-switch-group">
                    <button
                      onClick={() => {
                        setLang("en");
                        showScreenToast("Interface set to English.");
                      }}
                      className={`lang-btn px-2.5 py-1 rounded font-label-sm text-label-sm transition-colors ${
                        lang === "en" ? "bg-primary text-on-primary font-semibold" : "text-on-surface-variant hover:text-on-surface"
                      }`}
                      data-lang="en"
                      type="button"
                    >
                      English
                    </button>
                    <button
                      onClick={() => {
                        setLang("yo");
                        showScreenToast("Èdè Yorùbá ti wà ní àmúyẹ.");
                      }}
                      className={`lang-btn px-2.5 py-1 rounded font-label-sm text-label-sm transition-colors ${
                        lang === "yo" ? "bg-primary text-on-primary font-semibold" : "text-on-surface-variant hover:text-on-surface"
                      }`}
                      data-lang="yo"
                      type="button"
                    >
                      Yorùbá
                    </button>
                    <button
                      onClick={() => {
                        setLang("pcm");
                        showScreenToast("Nigerian Pidgin activated.");
                      }}
                      className={`lang-btn px-2.5 py-1 rounded font-label-sm text-label-sm transition-colors ${
                        lang === "pcm" ? "bg-primary text-on-primary font-semibold" : "text-on-surface-variant hover:text-on-surface"
                      }`}
                      data-lang="pcm"
                      type="button"
                    >
                      Nigerian Pidgin
                    </button>
                  </div>
                </div>

                <div className="px-space-md py-2 bg-primary-container text-on-primary-container flex items-center justify-between">
                  <div className="flex items-center gap-space-xs font-label-sm text-label-sm">
                    <Icon name="mic" className="text-secondary-fixed text-base" />{" "}
                    <span className="font-semibold">Voice Reasoning Active:</span> Yorùbá, Nigerian Pidgin, English dialect models synchronized.
                  </div>
                  <button
                    onClick={handleVoiceInput}
                    className="px-2 py-0.5 rounded bg-surface-container-lowest text-primary hover:bg-surface-container-high font-label-sm text-label-sm flex items-center gap-1 transition-colors"
                    id="btn-toggle-mic"
                    type="button"
                  >
                    <Icon name="settings_voice" className="text-sm" /> Tap to Speak
                  </button>
                </div>

                <div className="p-space-lg space-y-space-md max-h-[540px] overflow-y-auto">
                  {messages.map((m) =>
                    m.sender === "user" ? (
                      <div key={m.id} className="flex gap-space-sm items-start justify-end">
                        <div className="max-w-xl bg-surface-container-high p-space-md rounded-2xl rounded-tr-xs text-on-surface shadow-sm">
                          <div className="flex items-center justify-between gap-space-md mb-1 font-label-sm text-label-sm text-on-surface-variant">
                            <span className="font-semibold text-primary">{m.name}</span>
                            <span>{m.time}</span>
                          </div>
                          <p className="font-body-md text-body-md">{m.content}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
                          <Icon name="person" className="text-on-surface-variant text-base" />
                        </div>
                      </div>
                    ) : (
                      <div key={m.id} className="flex gap-space-sm items-start justify-start">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 text-on-primary">
                          <Icon name="psychology" className="text-base" />
                        </div>
                        <div className="max-w-2xl bg-surface-container-lowest p-space-md rounded-2xl rounded-tl-xs shadow-sm space-y-space-sm">
                          <div className="flex items-center justify-between gap-space-md font-label-sm text-label-sm">
                            <div className="flex items-center gap-1.5 text-secondary font-semibold">
                              <Icon name="verified" className="text-sm" />
                              <span>{m.name}</span>
                            </div>
                            <span className="text-on-surface-variant">{m.time} • Latency 142ms</span>
                          </div>
                          {m.warning && (
                            <div className="p-space-sm rounded-lg bg-error-container text-on-error-container flex items-start gap-2">
                              <Icon name="warning" className="text-lg shrink-0 mt-0.5" />
                              <div className="text-body-sm font-body-sm">
                                <strong className="font-bold">{m.warning}</strong>
                              </div>
                            </div>
                          )}
                          <div className="text-body-md font-body-md text-on-surface space-y-1">
                            <p>{m.content}</p>
                          </div>
                          {m.source && (
                            <div className="p-space-xs rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <Icon name="menu_book" className="text-sm text-secondary" />
                                <span>{m.source}</span>
                              </div>
                              <span className="text-secondary font-semibold">{m.confidence ?? "97.8% Confidence"}</span>
                            </div>
                          )}
                          <div className="pt-space-xs flex flex-wrap items-center gap-space-xs">
                            <button
                              onClick={() => {
                                setRescheduled(!rescheduled);
                                showScreenToast(
                                  rescheduled
                                    ? "Operation #OP-2026-104 reset to standard queue."
                                    : "Operation #OP-2026-104 rescheduled to Saturday 07:00 WAT. Roster updated."
                                );
                              }}
                              className={`px-3 py-1.5 rounded-lg text-label-sm font-label-sm flex items-center gap-1 transition-colors ${
                                rescheduled
                                  ? "bg-secondary text-on-secondary font-semibold"
                                  : "bg-primary text-on-primary hover:bg-primary-container"
                              }`}
                              type="button"
                            >
                              <Icon name={rescheduled ? "task_alt" : "event_repeat"} className="text-sm" />
                              <span>{rescheduled ? "Rescheduled to Sat 07:00 ✓" : "Reschedule Operation #OP-2026-104 to Sat 07:00"}</span>
                            </button>
                            <button
                              onClick={() => showScreenToast("SMS alert sent to Field Lead Adeleke O. via Telco Gateway.")}
                              className="px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant text-label-sm font-label-sm flex items-center gap-1 transition-colors"
                              type="button"
                            >
                              <Icon name="send" className="text-sm" /> Notify Field Lead Adeleke O.
                            </button>
                            <ScreenDialog title="Moisture Curve" side="center" panel={modalSaturationCurve}>
                              <button
                                onClick={() => {}}
                                className="px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant text-label-sm font-label-sm flex items-center gap-1 transition-colors"
                                type="button"
                              >
                                <Icon name="show_chart" className="text-sm" /> View Soil Saturation Curve
                              </button>
                            </ScreenDialog>
                          </div>
                        </div>
                      </div>
                    )
                  )}

                  <div className="ml-10 bg-surface-container-low p-space-md rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-on-surface font-semibold flex items-center gap-1">
                        <Icon name="water_drop" className="text-sm text-secondary" /> Plot A1 Moisture Simulation (Rain Horizon: Thu-Sun)
                      </span>
                      <span className="font-label-sm text-label-sm text-error font-medium">Critical Saturation Zone: Fri 16:00 - 23:00</span>
                    </div>
                    <div className="h-28 w-full">
                      <svg className="w-full h-full text-secondary" preserveAspectRatio="none" viewBox="0 0 600 100">
                        <line stroke="currentColor" strokeDasharray="4" strokeOpacity="0.1" x1="0" x2="600" y1="20" y2="20" />
                        <line stroke="currentColor" strokeDasharray="4" strokeOpacity="0.1" x1="0" x2="600" y1="50" y2="50" />
                        <line stroke="currentColor" strokeDasharray="4" strokeOpacity="0.1" x1="0" x2="600" y1="80" y2="80" />
                        <line stroke="#ba1a1a" strokeDasharray="6" strokeWidth="1.5" x1="0" x2="600" y1="35" y2="35" />
                        <text fill="#ba1a1a" fontFamily="Inter" fontSize="10" fontWeight="600" x="10" y="30">
                          Runoff Danger Threshold (38% Leaching Risk)
                        </text>
                        <path d="M 0,85 C 80,82 150,75 220,70 C 270,68 300,45 350,15 C 390,10 430,30 480,55 C 530,68 570,72 600,74" fill="none" stroke="#006c49" strokeWidth="3" />
                        <path d="M 0,85 C 80,82 150,75 220,70 C 270,68 300,45 350,15 C 390,10 430,30 480,55 C 530,68 570,72 600,74 L 600,100 L 0,100 Z" fill="#6cf8bb" fillOpacity="0.25" />
                        <circle cx="480" cy="55" fill="#134e33" r="5" />
                        <circle cx="480" cy="55" fill="#134e33" fillOpacity="0.3" r="9" />
                        <text fill="#134e33" fontFamily="Plus Jakarta Sans" fontSize="11" fontWeight="700" x="440" y="80">
                          Sat 07:00 (Optimal)
                        </text>
                      </svg>
                    </div>
                    <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                      <span>Thu 12:00 (Current)</span>
                      <span>Fri 06:00</span>
                      <span className="text-error font-semibold">Fri 18:00 (42mm Storm)</span>
                      <span className="text-secondary font-semibold">Sat 07:00 (Target)</span>
                      <span>Sun 12:00</span>
                    </div>
                  </div>
                </div>

                <div className="p-space-md bg-surface-container-low space-y-space-sm">
                  <div className="flex items-center gap-space-xs overflow-x-auto pb-1">
                    <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0">Quick Queries:</span>
                    <button
                      onClick={() => handleSendQuery("What is my current broiler feed runway?")}
                      className="quick-chip px-2.5 py-1 rounded-full bg-surface-container-lowest text-on-surface text-label-sm font-label-sm hover:bg-surface-container-high transition-colors whitespace-nowrap"
                      type="button"
                    >
                      What is my current broiler feed runway?
                    </button>
                    <button
                      onClick={() => handleSendQuery("Simulate 2-week cassava yield impact of delayed weeding")}
                      className="quick-chip px-2.5 py-1 rounded-full bg-surface-container-lowest text-on-surface text-label-sm font-label-sm hover:bg-surface-container-high transition-colors whitespace-nowrap"
                      type="button"
                    >
                      Simulate 2-week cassava yield impact of delayed weeding
                    </button>
                    <button
                      onClick={() => handleSendQuery("Translate morning instructions to Yorùbá for field hands")}
                      className="quick-chip px-2.5 py-1 rounded-full bg-surface-container-lowest text-on-surface text-label-sm font-label-sm hover:bg-surface-container-high transition-colors whitespace-nowrap"
                      type="button"
                    >
                      Translate morning instructions to Yorùbá for field hands
                    </button>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendQuery();
                    }}
                    className="flex items-center gap-space-xs bg-surface-container-lowest p-2 rounded-xl shadow-sm"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          showScreenToast(`Attached image/telemetry: ${e.target.files[0].name}`);
                        }
                      }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-on-surface-variant hover:text-primary rounded-lg transition-colors"
                      title="Attach Field Telemetry or Image"
                      type="button"
                    >
                      <Icon name="attach_file" className="text-xl" />
                    </button>
                    <input
                      value={inputQuery}
                      onChange={(e) => setInputQuery(e.target.value)}
                      className="flex-1 bg-transparent px-2 py-1 font-body-md text-body-md text-on-surface focus:outline-none placeholder:text-on-surface-variant/60"
                      id="ai-user-input"
                      placeholder="Ask anything about farm phenology, chemical dosage, rain windows, or worker dispatch..."
                      type="text"
                    />
                    <button
                      onClick={handleVoiceInput}
                      className="p-2 text-secondary hover:text-primary rounded-lg transition-colors"
                      title="Hold to record audio in Yorùbá / Pidgin / English"
                      type="button"
                    >
                      <Icon name="mic" className="text-xl" />
                    </button>
                    <button
                      onClick={() => {}}
                      className="px-space-md py-2 bg-primary text-on-primary rounded-lg hover:bg-primary-container transition-all font-label-md text-label-md flex items-center gap-1 shadow-sm"
                      id="ai-submit-btn"
                      type="submit"
                    >
                      <span>Send</span>
                      <Icon name="send" className="text-base" />
                    </button>
                  </form>
                </div>
              </section>
            )}

            <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg space-y-space-md">
              <div className="flex flex-wrap items-center justify-between gap-space-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-headline-sm text-headline-sm text-primary font-bold">Multimodal Diagnostic Vision Studio</h2>
                    <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm">Edge Inference Ready</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Instant field leaf, pest insect, and soil lesion classifier calibrated to Nigerian pathogens</p>
                </div>
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    showScreenToast("Image uploaded: ResNet-Savanna running leaf lesion classification...");
                  }}
                  className="px-space-md py-1.5 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant font-label-md text-label-md flex items-center gap-1.5 transition-colors"
                  type="button"
                >
                  <Icon name="add_a_photo" className="text-base" /> Upload Fresh Scan
                </button>
              </div>
              <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col md:flex-row gap-space-md items-start">
                <div className="relative w-full md:w-56 h-48 rounded-lg overflow-hidden shrink-0 shadow-sm bg-surface-container">
                  <img
                    className="w-full h-full object-cover"
                    data-alt="Close up high-resolution macroscopic photo of a Roma tomato plant leaf showing distinct concentric ring lesions characteristic of Early Blight Alternaria solani in a sunny humid Nigerian farm field, surrounded by agricultural diagnostic bounding boxes and telemetry overlays in rich greens and slate tones."
                    src="/images/screens/2d0db497be43.webp"
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex flex-col justify-end p-2 text-on-primary">
                    <div className="flex items-center justify-between font-label-sm text-label-sm">
                      <span className="bg-primary/80 px-1.5 py-0.5 rounded font-mono">CAM-02-B1</span>
                      <span>Captured 2h ago</span>
                    </div>
                  </div>
                  <div className="absolute top-8 left-10 w-24 h-24 border-2 border-dashed border-error rounded pointer-events-none flex items-start justify-end p-1">
                    <span className="bg-error text-on-error font-label-sm text-label-sm px-1 rounded">Alternaria 94%</span>
                  </div>
                </div>
                <div className="flex-1 space-y-space-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">Pathogen Identified</span>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Plot B1 Roma Tomato</span>
                    </div>
                    <span className="font-label-md text-label-md text-secondary font-bold">94% Confidence</span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface">
                    <strong>
                      Early Blight (<em>Alternaria solani</em>)
                    </strong>{" "}
                    detected on 3 lower foliar leaves. Fungal spore germination triggered by 3 consecutive nights of &gt;85% relative humidity and 23°C dew point.
                  </p>
                  <div className="p-space-sm rounded-lg bg-surface-container-highest text-on-surface space-y-1">
                    <div className="flex items-center gap-1.5 text-tertiary font-label-sm text-label-sm font-bold uppercase tracking-wider">
                      <Icon name="shield" className="text-base" />
                      <span>Mandatory Chemical Safety Guardrail (SOP §4.1)</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface">
                      <strong>Pre-Harvest Interval (PHI):</strong> 14 Days. <strong>Spray rate:</strong> 2.5g/L Copper Hydroxide (Kocide 2000).{" "}
                      <strong>PPE Requirement:</strong> Level 3 (Respirator mask, rubber gauntlets, face shield).
                    </p>
                    <div className="flex items-center gap-1 text-error font-label-sm text-label-sm font-semibold">
                      <Icon name="air" className="text-sm" />
                      <span>Do not apply during flowering wind gusts &gt; 15 km/h (Current Wind: 8 km/h calm).</span>
                    </div>
                  </div>
                  <div className="pt-space-xs flex flex-wrap items-center gap-space-xs">
                    <button
                      onClick={() => {
                        setSprayApproved(!sprayApproved);
                        showScreenToast(
                          sprayApproved
                            ? "Knapsack spray task unassigned."
                            : "Knapsack spray task approved for Plot B1. Task assigned to Operator Adeleke O."
                        );
                      }}
                      className={`px-3 py-1.5 rounded-lg text-label-sm font-label-sm flex items-center gap-1 transition-colors ${
                        sprayApproved
                          ? "bg-primary text-on-primary font-semibold"
                          : "bg-secondary text-on-secondary hover:bg-primary"
                      }`}
                      type="button"
                    >
                      <Icon name={sprayApproved ? "check_circle" : "task_alt"} className="text-sm" />
                      <span>{sprayApproved ? "Knapsack Task Assigned ✓" : "Approve Knapsack Spray Task for Plot B1"}</span>
                    </button>
                    <button
                      onClick={() => showScreenToast("Warehouse Silo Stock checked: 4.2kg Copper Hydroxide available in Store 01 (Sufficient for 1.8 Ha).")}
                      className="px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant font-label-sm text-label-sm flex items-center gap-1 transition-colors"
                      type="button"
                    >
                      <Icon name="inventory_2" className="text-sm" /> Check Copper Hydroxide Silo Stock (4.2kg Left)
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="lg:col-span-5 space-y-space-lg">
            <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg space-y-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
                    <Icon name="auto_awesome" className="text-lg" />
                  </div>
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-primary font-bold">Synthesized Farm Morning Briefing</h2>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Multi-source automated synthesis across 42.5 Ha</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
                  Today • 12 May 2026
                </span>
              </div>
              <div className="space-y-space-sm">
                <div className="p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-error" />
                      <span className="font-label-sm text-label-sm text-on-surface font-bold uppercase tracking-wider">1. Crop Risk • Plot B1</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-error font-semibold">Elevated Fungal Pressure</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Roma tomato fungal pressure elevated due to 88% evening humidity. Preventive systemic spray recommended before Friday storm.
                  </p>
                  <div className="pt-1 flex justify-end">
                    <ScreenDialog title="Pathogen Curve" side="center" panel={modalSaturationCurve}>
                      <button onClick={() => {}} className="text-secondary font-label-sm text-label-sm font-bold flex items-center gap-0.5 hover:underline" type="button">
                        View Pathogen Curve <Icon name="arrow_forward" className="text-xs" />
                      </button>
                    </ScreenDialog>
                  </div>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-tertiary" />
                      <span className="font-label-sm text-label-sm text-on-surface font-bold uppercase tracking-wider">2. Livestock • Broiler House 1</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-tertiary font-semibold">
                      {fansRunning ? "Fans Running (24.1°C Target)" : "Thermal Alert (28.2°C)"}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Ammonia levels (8 ppm) within safe threshold (&lt;20 ppm), but ambient temperature peaking at 28.2°C at 13:00 WAT. Trigger evaporative fan cycle to prevent heat-stress mortality.
                  </p>
                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() => {
                        setFansRunning(!fansRunning);
                        showScreenToast(
                          fansRunning
                            ? "Evaporative fans set to automatic sensor loop."
                            : "Evaporative fan cycle activated. Air speed 1.8 m/s, target temperature set to 24°C."
                        );
                      }}
                      className="text-secondary font-label-sm text-label-sm font-bold flex items-center gap-0.5 hover:underline"
                      type="button"
                    >
                      <span>{fansRunning ? "Fans Running (Cycle Active)" : "Trigger Automation Fans"}</span>
                      <Icon name="arrow_forward" className="text-xs" />
                    </button>
                  </div>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-secondary" />
                      <span className="font-label-sm text-label-sm text-on-surface font-bold uppercase tracking-wider">3. Inventory &amp; Supplies</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">Stock Check</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Urea Split-2 (12 bags) staged and ready in Store 01. Copper Hydroxide fungicide reorder required within 3 days for upcoming second flush.
                  </p>
                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() => {
                        setReorderDone(!reorderDone);
                        showScreenToast(
                          reorderDone
                            ? "Requisition cancelled."
                            : "Reorder for 10kg Copper Hydroxide submitted to Agro-Dealer Hub. Escrow hold prepared."
                        );
                      }}
                      className="text-secondary font-label-sm text-label-sm font-bold flex items-center gap-0.5 hover:underline"
                      type="button"
                    >
                      <span>{reorderDone ? "Reordered (PO-9921) ✓" : "Reorder via Marketplace"}</span>
                      <Icon name="arrow_forward" className="text-xs" />
                    </button>
                  </div>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      <span className="font-label-sm text-label-sm text-on-surface font-bold uppercase tracking-wider">4. Finance &amp; Machinery</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-primary font-semibold">
                      {escrowReleased ? "Escrow Payout Complete" : "Reconciled"}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    ₦420,000 harrowing expense reconciled with tractor GPS telemetry logs (Plot C2 &amp; C3). ₦95,000 operator payout pending farmer Proof of Work confirmation.
                  </p>
                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() => {
                        setEscrowReleased(true);
                        showScreenToast("₦95,000 operator escrow released to Tractor Operator Lateef (Providus Node #TX-99182).");
                      }}
                      className="text-secondary font-label-sm text-label-sm font-bold flex items-center gap-0.5 hover:underline"
                      type="button"
                    >
                      <span>{escrowReleased ? "Funds Released (₦95,000) ✓" : "Release Escrow Funds"}</span>
                      <Icon name="arrow_forward" className="text-xs" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg space-y-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-secondary text-on-secondary flex items-center justify-center">
                    <Icon name="schema" className="text-lg" />
                  </div>
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-primary font-bold">Explainable AI Reasoning Engine</h2>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Strict Human-in-the-Loop Protocol §8.1.E</span>
                  </div>
                </div>
                <span className="font-label-sm text-label-sm text-secondary font-bold">Zero Autonomous Writes</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                CultivaNode AI formulates verifiable hypotheses by chaining live IoT sensor streams against peer-reviewed regional agronomic models. High-stakes actions require manual farmer verification.
              </p>
              <div className="space-y-space-sm">
                <div className="p-space-sm bg-surface-container-low rounded-lg space-y-1">
                  <div className="flex items-center justify-between font-label-sm text-label-sm">
                    <span className="font-semibold text-primary">Supporting Sensor Inputs</span>
                    <span className="text-secondary font-bold">6 Data Streams</span>
                  </div>
                  <div className="flex flex-wrap gap-1 text-label-sm font-label-sm">
                    <span className="px-2 py-0.5 bg-surface-container-lowest rounded text-on-surface">NiMet Doppler (42mm rain)</span>
                    <span className="px-2 py-0.5 bg-surface-container-lowest rounded text-on-surface">Tensiometer A1 (24 cbar)</span>
                    <span className="px-2 py-0.5 bg-surface-container-lowest rounded text-on-surface">NDVI Satellite (0.71)</span>
                    <span className="px-2 py-0.5 bg-surface-container-lowest rounded text-on-surface">IoT Hygro (88% RH)</span>
                  </div>
                </div>
                <div className="p-space-sm bg-surface-container-low rounded-lg space-y-1">
                  <div className="flex items-center justify-between font-label-sm text-label-sm">
                    <span className="font-semibold text-primary">Uncertainty Bounds &amp; Risk Range</span>
                    <span className="text-on-surface-variant">±4.8% Sensitivity</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden flex">
                    <div className="bg-secondary h-full rounded-full" style={{ width: "94%" }} />
                  </div>
                  <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>Lower Bound: 89.4% (Heavy storm lag)</span>
                    <span className="font-semibold text-primary">94.2% Nominal</span>
                    <span>Upper Bound: 98.1% (Runoff match)</span>
                  </div>
                </div>
                <div className="p-space-md rounded-lg bg-tertiary-fixed text-on-tertiary-fixed flex items-start gap-2.5">
                  <Icon name="verified_user" className="text-xl shrink-0 mt-0.5" />
                  <div className="space-y-1 font-body-sm text-body-sm">
                    <div className="font-bold text-headline-sm text-sm">Human Confirmation Mandate</div>
                    <p>
                      Per Farm Safety Policy §8.1.E, rescheduling of fertilizer applications exceeding ₦100,000 in material value or &gt;5 Ha requires approval from certified Lead Agronomist.
                    </p>
                    <div className="pt-1 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setMandateApproved(!mandateApproved);
                          showScreenToast(
                            mandateApproved
                              ? "Authorization signature removed."
                              : "Reschedule authorized by Quadri Olapade (Lead Agronomist PIN verified)."
                          );
                        }}
                        className={`px-3 py-1 rounded font-label-sm text-label-sm font-semibold transition-colors ${
                          mandateApproved
                            ? "bg-primary text-on-primary"
                            : "bg-tertiary text-on-tertiary hover:bg-tertiary-container"
                        }`}
                        type="button"
                      >
                        {mandateApproved ? "Authorized (Quadri Olapade) ✓" : "Authorize Reschedule (Quadri Olapade)"}
                      </button>
                      <button
                        onClick={() => showScreenToast("Safety mandate alert dismissed.")}
                        className="px-3 py-1 bg-surface-container-lowest text-on-surface rounded font-label-sm text-label-sm hover:bg-surface-container-high transition-colors"
                        type="button"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg space-y-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-high text-primary flex items-center justify-center">
                    <Icon name="local_library" className="text-lg" />
                  </div>
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-primary font-bold">Agronomic Knowledge Base</h2>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Active regional agronomy standard rules</span>
                  </div>
                </div>
                <Icon name="cloud_done" className="text-secondary" />
              </div>
              <div className="space-y-space-xs">
                <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <Icon name="grass" className="text-secondary text-xl" />
                    <div>
                      <div className="font-label-md text-label-md text-on-surface font-semibold">IITA Maize Protocol (Guinea Savanna)</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Edition 2026.1 • N-P-K &amp; Urea timing logic</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
                    Active
                  </span>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <Icon name="spa" className="text-secondary text-xl" />
                    <div>
                      <div className="font-label-md text-label-md text-on-surface font-semibold">NIHORT Solanaceous Production Guide</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Early Blight &amp; Bacterial Wilt Thresholds</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
                    Active
                  </span>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <Icon name="cloud_sync" className="text-secondary text-xl" />
                    <div>
                      <div className="font-label-md text-label-md text-on-surface font-semibold">Oyo Savanna Rain Calendar 2026</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">NiMet Localized Inset #OYO-ISEYIN-09</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
                    Synced
                  </span>
                </div>
              </div>
              <ScreenDialog title="Agronomy Rules" side="center" panel={modalRulesRepository}>
                <button
                  onClick={() => {}}
                  className="w-full py-2 bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors rounded-lg font-label-md text-label-md flex items-center justify-center gap-1.5"
                  type="button"
                >
                  <Icon name="manage_search" className="text-base" /> Browse Full Agronomy Rule Repository (148 SOPs)
                </button>
              </ScreenDialog>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
