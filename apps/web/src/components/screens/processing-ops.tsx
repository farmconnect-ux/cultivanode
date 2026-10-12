"use client";

// Ported from the "agro_processing_operations_6.6" design.
import { useState } from "react";
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogClose, showScreenToast } from "@/components/ds/screen-dialog";
import { downloadFile } from "@/lib/download";
import type { ScreenProps } from "./types";

export function ProcessingOps(_props: ScreenProps) {
  const [pipelineFilter, setPipelineFilter] = useState<"all" | "cassava" | "rice" | "oilseed" | "completed">("all");

  // Modals
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  const [isScheduleRunModalOpen, setIsScheduleRunModalOpen] = useState(false);
  const [activeTelemetryModal, setActiveTelemetryModal] = useState<{ title: string; subtitle: string; content: React.ReactNode } | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Form States
  const [intakeCommodity, setIntakeCommodity] = useState("Cassava Roots (TME-419)");
  const [intakeVolume, setIntakeVolume] = useState("65.0");
  const [intakeSupplier, setIntakeSupplier] = useState("Ado Outgrowers Union (#LOT-ADO-401)");
  const [intakeMoisture, setIntakeMoisture] = useState("25.8% Starch");

  const [runLine, setRunLine] = useState("Line A: Flash Dryer & Centrifuge (Cassava Starch)");
  const [runTargetMT, setRunTargetMT] = useState("65.0");
  const [runShift, setRunShift] = useState("Morning Shift (06:00 - 14:00)");

  const handleExportYield = () => {
    const csv = [
      "Batch_ID,Processing_Line,Commodity,Input_MT,Output_Product,Output_MT,Recovery_Rate,Status",
      "RUN-2026-CS-084,Line A (Flash Unit),Cassava TME-419,65.0,Native Food Starch,14.8,24.2%,In-Process (74%)",
      "RUN-2026-RC-032,Line B (Milling),Paddy Rice Faro-44,40.0,Premium Head Rice,24.8,68.5%,QA Pack (92%)",
      "RUN-2026-SY-019,Line C (Expeller),Yellow Soybean,25.0,Cold-Pressed Crude Oil,4.75,19.0%,Pressing (61%)",
      "RUN-2026-CS-083,Line A (Flash Unit),Cassava TME-419,120.0,Native Food Starch,29.4,24.5%,Completed",
    ].join("\n");
    downloadFile(csv, `Agro_Processing_Yield_Analytics_${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
    showScreenToast("Exported Agro-Processing Yield Recovery Analytics (CSV).");
  };

  const handleDownloadCoA = () => {
    const coa = {
      certificateNumber: "COA-NAFDAC-2026-9921",
      productName: "Industrial Native Food Grade Cassava Starch",
      processingFacility: "Iseyin-Ado Agro-Industrial Milling Complex",
      batchReference: "RUN-2026-CS-084",
      inspectionDate: new Date().toISOString(),
      standardsApplied: "NAFDAC NIS 387:2004 / ISO 22000",
      assayResults: {
        starchPurity: "99.2%",
        moistureContent: "11.8% (Spec <= 12%)",
        pH: "5.8 (Optimal 5.5 - 6.5)",
        aflatoxinTotal: "<2.0 ppb (Safe limit <= 10 ppb)",
        cyanogenicGlucoside: "<10 mg/kg (Safe)",
        heavyMetals: "Non-detectable",
      },
      certifiedBy: "Engr. B. Adeleke (Quality Control Lead)",
      disposition: "APPROVED FOR COMMERCIAL PACKAGING",
    };
    downloadFile(JSON.stringify(coa, null, 2), `Certificate_of_Analysis_RUN_CS_084.json`, "application/json");
    showScreenToast("Downloaded Lab Certificate of Analysis (CoA).");
  };

  const handleLogIntake = (e: React.FormEvent) => {
    e.preventDefault();
    setIsIntakeModalOpen(false);
    showScreenToast(`Logged intake of ${intakeVolume} MT of ${intakeCommodity} from ${intakeSupplier}`);
  };

  const handleScheduleRun = (e: React.FormEvent) => {
    e.preventDefault();
    setIsScheduleRunModalOpen(false);
    showScreenToast(`Scheduled processing batch on ${runLine} for ${runTargetMT} MT.`);
  };

  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <section className="flex flex-col gap-space-sm mb-space-lg">
          <div className="flex flex-wrap items-center gap-space-xs font-label-md text-label-md text-on-surface-variant">
            <span>Agricultural Commerce</span>
            <Icon name="chevron_right" className="text-[14px] text-outline" />
            <span>Agro-processing &amp; Value Addition (§6.6)</span>
            <Icon name="chevron_right" className="text-[14px] text-outline" />
            <span className="text-primary font-semibold">Western Agri-Industrial Processing Zone (Ibadan / Ado-Awaye / Sagamu / Ede)</span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mt-space-xs">
            <div>
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface tracking-tight">Agro-processing &amp; Value-Addition Operations Hub</h1>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-4xl mt-space-xs">End-to-end transformation telemetry: raw commodity intake, industrial milling &amp; solvent extraction runs, extraction yield recovery ratios, by-product circular valorization, and NAFDAC / ISO 22000 quality certification.</p>
            </div>
            <div className="flex flex-wrap items-center gap-space-sm">
              {_props.slots?.actions ?? (
                <>
                  <button
                    onClick={handleExportYield}
                    className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-low text-on-surface font-label-lg text-label-lg shadow-sm hover:bg-surface-container transition-all"
                    type="button"
                  >
                    <Icon name="download" className="text-[18px] text-on-surface-variant" />
                    <span>Export Yield Analytics</span>
                  </button>
                  <button
                    onClick={() => setIsIntakeModalOpen(true)}
                    className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-low text-on-surface font-label-lg text-label-lg shadow-sm hover:bg-surface-container transition-all"
                    type="button"
                  >
                    <Icon name="input" className="text-[18px] text-secondary" />
                    <span>Log Raw Material Intake</span>
                  </button>
                  <button
                    onClick={() => setIsScheduleRunModalOpen(true)}
                    className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg shadow-sm hover:bg-primary transition-all"
                    type="button"
                  >
                    <Icon name="play_circle" className="text-[18px] text-primary-fixed" />
                    <span>Schedule Processing Run</span>
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-sm mt-space-sm p-space-sm bg-surface-container-low rounded-xl shadow-sm">
            <div className="flex items-center gap-space-xs px-space-sm py-1 bg-surface-container-lowest rounded-lg shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary-fixed-dim animate-pulse" />
              <Icon name="factory" className="text-[18px] text-primary" />
              <span className="font-label-md text-label-md text-on-surface font-semibold">Iseyin-Ado Agro-Industrial Milling Complex</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">· Line A: Flash Dryer · Line B: Rice Dehuller · Line C: Soya Expeller</span>
            </div>
            <div className="flex flex-wrap items-center gap-space-xs font-label-sm text-label-sm">
              <div className="flex items-center gap-space-xs px-space-sm py-1 rounded-md bg-surface-container text-on-surface font-medium">
                <Icon name="bolt" className="text-[16px] text-secondary" />
                <span>Perkins 800kVA + 120kW Solar (Active)</span>
              </div>
              <div className="flex items-center gap-space-xs px-space-sm py-1 rounded-md bg-surface-container text-on-surface font-medium">
                <Icon name="valve" className="text-[16px] text-tertiary-container" />
                <span>Boiler: 8.4 Bar (Biomass Briquette)</span>
              </div>
              <div className="flex items-center gap-space-xs px-space-sm py-1 rounded-md bg-surface-container text-on-surface font-medium">
                <Icon name="water_drop" className="text-[16px] text-secondary" />
                <span>RO Permeate: 14,000 L/h</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-space-md mb-space-xl">
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Raw Intake (MTD)</span>
              <Icon name="scale" className="text-[20px] text-secondary" />
            </div>
            <div className="my-space-xs">
              <div className="font-metric-num text-metric-num text-on-surface">1,280 <span className="font-label-md text-label-md font-normal text-on-surface-variant">MT</span></div>
              <div className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">940 MT Cassava · 240 MT Paddy · 100 MT Soya</div>
            </div>
            <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-secondary font-semibold">
              <Icon name="trending_up" className="text-[16px]" />
              <span>+18.4% MoM Throughput</span>
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Avg Yield Recovery</span>
              <Icon name="grain" className="text-[20px] text-primary" />
            </div>
            <div className="my-space-xs">
              <div className="font-metric-num text-metric-num text-on-surface">24.8% <span className="font-label-md text-label-md font-normal text-on-surface-variant">Starch</span></div>
              <div className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">68.2% Rice Head · 18.9% Soya Oil</div>
            </div>
            <div className="flex items-center gap-space-xs px-space-xs py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed w-fit font-label-sm text-label-sm font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              <span>+1.3% vs Standard Target</span>
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Active Run Batches</span>
              <Icon name="conveyor_belt" className="text-[20px] text-primary-container" />
            </div>
            <div className="my-space-xs">
              <div className="font-metric-num text-metric-num text-on-surface">4 <span className="font-label-md text-label-md font-normal text-on-surface-variant">Live Batches</span></div>
              <div className="font-body-sm text-body-sm text-on-surface-variant">2 In-Process · 1 Drying · 1 QA Pack</div>
            </div>
            <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-on-surface-variant">
              <Icon name="check_circle" className="text-[16px] text-secondary" />
              <span>All Lines Online</span>
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Finished Valuation</span>
              <Icon name="inventory_2" className="text-[20px] text-secondary" />
            </div>
            <div className="my-space-xs">
              <div className="font-metric-num text-metric-num text-on-surface">₦214.8M</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">In Safe Depot Inventory</div>
            </div>
            <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-secondary font-semibold">
              <Icon name="verified" className="text-[16px]" />
              <span>Off-take Allocated: 78%</span>
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Plant OEE Metric</span>
              <Icon name="speed" className="text-[20px] text-primary" />
            </div>
            <div className="my-space-xs">
              <div className="font-metric-num text-metric-num text-on-surface">86.4%</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant">Avail 91.2% · Perf 96.5% · QA 98.1%</div>
            </div>
            <div className="w-full bg-surface-container rounded-full h-1.5 mt-1 overflow-hidden">
              <div className="bg-primary-container h-1.5 rounded-full" style={{ width: "86.4%" }} />
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Circular Valorization</span>
              <Icon name="recycling" className="text-[20px] text-secondary" />
            </div>
            <div className="my-space-xs">
              <div className="font-metric-num text-metric-num text-on-surface">184 <span className="font-label-md text-label-md font-normal text-on-surface-variant">MT</span></div>
              <div className="font-body-sm text-body-sm text-on-surface-variant">Peel Feed &amp; Boiler Husk</div>
            </div>
            <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-secondary font-semibold">
              <span>₦4.8M Recovered Value</span>
            </div>
          </div>
        </section>

        <section className="flex flex-col mb-space-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-md">
            <div className="flex items-center gap-space-sm">
              <Icon name="precision_manufacturing" className="text-primary text-[24px]" />
              <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Active Batch Operations Pipeline</h2>
            </div>
            <div className="flex items-center gap-1 p-1 bg-surface-container-low rounded-lg font-label-md text-label-md">
              {[
                { id: "all", label: "All Active Runs (4)" },
                { id: "cassava", label: "Cassava Starch" },
                { id: "rice", label: "Rice Parboiling" },
                { id: "oilseed", label: "Oilseed Expeller" },
                { id: "completed", label: "Completed" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setPipelineFilter(tab.id as any);
                    showScreenToast(`Filtering pipeline: ${tab.label}`);
                  }}
                  className={`px-space-md py-1 rounded-md transition-colors ${
                    pipelineFilter === tab.id
                      ? "bg-surface-container-lowest text-primary font-bold shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
            {(pipelineFilter === "all" || pipelineFilter === "cassava") && (
              <div className="flex flex-col rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="p-space-md bg-surface-container-low flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="px-2 py-0.5 rounded text-label-sm font-label-sm font-semibold bg-secondary-fixed text-on-secondary-fixed">LIVE STAGE</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface">#RUN-2026-CS-084</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm">Line A (Flash Unit)</span>
                </div>
                <div className="p-space-md flex flex-col flex-1 gap-space-md">
                  <div className="flex items-start justify-between gap-space-sm">
                    <div>
                      <div className="font-label-lg text-label-lg font-semibold text-primary">Industrial Native Starch (Food Grade)</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant">NAFDAC Reg: 01-9921 · Psaltry Quality Standard</div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">24.2% Est. Yield</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-space-xs p-space-sm bg-surface-container-low rounded-lg text-body-sm font-body-sm">
                    <div>
                      <span className="text-on-surface-variant font-label-sm text-label-sm block">Input Ingested:</span>
                      <span className="font-semibold text-on-surface">65.0 MT TME-419</span>
                      <span className="text-outline text-label-sm block">Age: 11h · #LOT-ADO-401</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant font-label-sm text-label-sm block">Expected Target:</span>
                      <span className="font-semibold text-on-surface">14.8 MT Dry Native</span>
                      <span className="text-secondary text-label-sm block">Wet Cake: 16.2 MT</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex justify-between items-center text-label-sm font-label-sm text-on-surface-variant">
                      <span>Stage: Hydrocyclone &amp; Separator Centrifuge</span>
                      <span className="font-bold text-primary">74% Complete</span>
                    </div>
                    <div className="w-full bg-surface-container-low rounded-full h-2 overflow-hidden">
                      <div className="bg-primary-container h-2 rounded-full" style={{ width: "74%" }} />
                    </div>
                    <div className="grid grid-cols-3 gap-1 mt-1 text-center font-label-sm text-label-sm">
                      <div className="p-1 rounded bg-surface-container-low">
                        <span className="text-outline block text-[10px]">INTAKE RATE</span>
                        <span className="font-semibold text-on-surface">8.5 MT/h</span>
                      </div>
                      <div className="p-1 rounded bg-surface-container-low">
                        <span className="text-outline block text-[10px]">GRATER RPM</span>
                        <span className="font-semibold text-on-surface">2,800 RPM</span>
                      </div>
                      <div className="p-1 rounded bg-surface-container-low">
                        <span className="text-outline block text-[10px]">SLURRY DENSITY</span>
                        <span className="font-semibold text-on-surface">1.18 g/cm³</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant pt-space-xs">
                    <span className="flex items-center gap-1"><Icon name="water" className="text-[16px] text-secondary" /> 3.2 m³/MT root</span>
                    <span className="flex items-center gap-1"><Icon name="local_fire_department" className="text-[16px] text-tertiary-container" /> 1.4 MT/h Steam</span>
                  </div>
                  <div className="flex items-center gap-space-xs mt-auto pt-space-sm">
                    <button
                      onClick={() =>
                        setActiveTelemetryModal({
                          title: "Stage Sensors: #RUN-2026-CS-084",
                          subtitle: "Line A Hydrocyclone & Decanter Telemetry",
                          content: (
                            <div className="space-y-2 text-sm">
                              <div><strong>Slurry Temperature:</strong> 28.4°C (Normal)</div>
                              <div><strong>Separator Pressure:</strong> 4.2 Bar</div>
                              <div><strong>Starch Slurry Brix:</strong> 22.8° Bx</div>
                              <div><strong>Wash Water Recirculation:</strong> 72% recycled</div>
                            </div>
                          ),
                        })
                      }
                      className="flex-1 py-1.5 px-space-sm rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors"
                      type="button"
                    >
                      Stage Sensors
                    </button>
                    <button
                      onClick={() =>
                        setActiveTelemetryModal({
                          title: "Centrifuge RPM Live Controller",
                          subtitle: "Decanter Centrifuge D-01 Speed Monitor",
                          content: (
                            <div className="space-y-2 text-sm">
                              <div><strong>Main Bowl Speed:</strong> 3,250 RPM</div>
                              <div><strong>Scroll Differential:</strong> 18.5 RPM</div>
                              <div><strong>Motor Load:</strong> 64 kW (78% capacity)</div>
                              <div><strong>Bearing Vibration:</strong> 1.2 mm/s (Healthy)</div>
                            </div>
                          ),
                        })
                      }
                      className="flex-1 py-1.5 px-space-sm rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors"
                      type="button"
                    >
                      Centrifuge RPM
                    </button>
                    <button
                      onClick={() =>
                        setActiveTelemetryModal({
                          title: "Lab Viscosity Assay (#QC-882)",
                          subtitle: "Brabender Amylograph Peak Viscosity Test",
                          content: (
                            <div className="space-y-2 text-sm">
                              <div><strong>Peak Viscosity:</strong> 820 BU (Grade A Specification)</div>
                              <div><strong>Gelatinization Temperature:</strong> 65.2°C</div>
                              <div><strong>Breakdown:</strong> 240 BU</div>
                              <div><strong>Setback:</strong> 180 BU (Stable)</div>
                            </div>
                          ),
                        })
                      }
                      className="py-1.5 px-space-sm rounded-lg bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary transition-colors"
                      type="button"
                    >
                      Lab Viscosity
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(pipelineFilter === "all" || pipelineFilter === "rice") && (
              <div className="flex flex-col rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="p-space-md bg-surface-container-low flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="px-2 py-0.5 rounded text-label-sm font-label-sm font-semibold bg-surface-container text-on-surface">FINAL QA PACK</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface">#RUN-2026-RC-032</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm">Line B (Milling)</span>
                </div>
                <div className="p-space-md flex flex-col flex-1 gap-space-md">
                  <div className="flex items-start justify-between gap-space-sm">
                    <div>
                      <div className="font-label-lg text-label-lg font-semibold text-primary">Premium Parboiled Faro 44 Long-Grain</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant">Grade A 50kg Bags · Export Optical Sort</div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">68.5% Total Yield</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-space-xs p-space-sm bg-surface-container-low rounded-lg text-body-sm font-body-sm">
                    <div>
                      <span className="text-on-surface-variant font-label-sm text-label-sm block">Input Consigned:</span>
                      <span className="font-semibold text-on-surface">40.0 MT Paddy Rice</span>
                      <span className="text-outline text-label-sm block">Moisture 13.1% · #LOT-EGB-055</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant font-label-sm text-label-sm block">Clean Output Realized:</span>
                      <span className="font-semibold text-on-surface">27.4 MT Total</span>
                      <span className="text-secondary text-label-sm block">Head Rice: 24.8 MT (90.5%)</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex justify-between items-center text-label-sm font-label-sm text-on-surface-variant">
                      <span>Stage: Optical Color Sorter &amp; Poly Bagging</span>
                      <span className="font-bold text-secondary">92% Packaged</span>
                    </div>
                    <div className="w-full bg-surface-container-low rounded-full h-2 overflow-hidden">
                      <div className="bg-secondary h-2 rounded-full" style={{ width: "92%" }} />
                    </div>
                    <div className="grid grid-cols-3 gap-1 mt-1 text-center font-label-sm text-label-sm">
                      <div className="p-1 rounded bg-surface-container-low">
                        <span className="text-outline block text-[10px]">BROKEN RICE</span>
                        <span className="font-semibold text-on-surface">2.6 MT (Brewer)</span>
                      </div>
                      <div className="p-1 rounded bg-surface-container-low">
                        <span className="text-outline block text-[10px]">HUSK TO BOILER</span>
                        <span className="font-semibold text-on-surface">8.2 MT Biomass</span>
                      </div>
                      <div className="p-1 rounded bg-surface-container-low">
                        <span className="text-outline block text-[10px]">RICE BRAN</span>
                        <span className="font-semibold text-on-surface">4.4 MT Feed</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant pt-space-xs">
                    <span className="flex items-center gap-1"><Icon name="verified" className="text-[16px] text-secondary" /> Whiteness Index 44.5</span>
                    <span className="flex items-center gap-1"><Icon name="filter_alt" className="text-[16px] text-primary" /> Rejection 0.8%</span>
                  </div>
                  <div className="flex items-center gap-space-xs mt-auto pt-space-sm">
                    <button
                      onClick={() => {
                        showScreenToast("Released Lot #RUN-2026-RC-032 (24.8 MT) to finished warehouse.");
                      }}
                      className="flex-1 py-1.5 px-space-sm rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors"
                      type="button"
                    >
                      Release Lot
                    </button>
                    <button
                      onClick={() => {
                        showScreenToast("Transmitted 496 QR bag barcodes to Zebra thermal printer.");
                      }}
                      className="flex-1 py-1.5 px-space-sm rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors"
                      type="button"
                    >
                      Print Labels
                    </button>
                    <button
                      onClick={handleDownloadCoA}
                      className="py-1.5 px-space-sm rounded-lg bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary transition-colors"
                      type="button"
                    >
                      Generate COA
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(pipelineFilter === "all" || pipelineFilter === "oilseed") && (
              <div className="flex flex-col rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="p-space-md bg-surface-container-low flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="px-2 py-0.5 rounded text-label-sm font-label-sm font-semibold bg-tertiary-fixed text-on-tertiary-fixed">IN EXPELLER</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface">#RUN-2026-SY-019</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm">Line C (Press)</span>
                </div>
                <div className="p-space-md flex flex-col flex-1 gap-space-md">
                  <div className="flex items-start justify-between gap-space-sm">
                    <div>
                      <div className="font-label-lg text-label-lg font-semibold text-primary">Non-GMO Cold-Pressed Crude Soya Oil</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant">44% Crude Protein Defatted Meal Co-product</div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">19.0% Oil Yield</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-space-xs p-space-sm bg-surface-container-low rounded-lg text-body-sm font-body-sm">
                    <div>
                      <span className="text-on-surface-variant font-label-sm text-label-sm block">Input Grain:</span>
                      <span className="font-semibold text-on-surface">25.0 MT Yellow Soybean</span>
                      <span className="text-outline text-label-sm block">TGX-1448E · Oke-Ogun Hub</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant font-label-sm text-label-sm block">Yield Partition:</span>
                      <span className="font-semibold text-on-surface">4.75 MT Crude Oil</span>
                      <span className="text-secondary text-label-sm block">+19.8 MT Soya Cake</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex justify-between items-center text-label-sm font-label-sm text-on-surface-variant">
                      <span>Stage: Screw Pressing &amp; Oil Filtration</span>
                      <span className="font-bold text-primary">61% Complete</span>
                    </div>
                    <div className="w-full bg-surface-container-low rounded-full h-2 overflow-hidden">
                      <div className="bg-primary-container h-2 rounded-full" style={{ width: "61%" }} />
                    </div>
                    <div className="grid grid-cols-3 gap-1 mt-1 text-center font-label-sm text-label-sm">
                      <div className="p-1 rounded bg-surface-container-low">
                        <span className="text-outline block text-[10px]">PRESS TEMP</span>
                        <span className="font-semibold text-on-surface">64°C (Optimum)</span>
                      </div>
                      <div className="p-1 rounded bg-surface-container-low">
                        <span className="text-outline block text-[10px]">CAKE MOISTURE</span>
                        <span className="font-semibold text-on-surface">9.2% Spec</span>
                      </div>
                      <div className="p-1 rounded bg-surface-container-low">
                        <span className="text-outline block text-[10px]">OIL CLARITY</span>
                        <span className="font-semibold text-on-surface">Golden Amber</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant pt-space-xs">
                    <span className="flex items-center gap-1"><Icon name="science" className="text-[16px] text-secondary" /> FFA: 1.18% (Target &lt;1.5%)</span>
                    <span className="flex items-center gap-1"><Icon name="heat_pump" className="text-[16px] text-tertiary" /> 21 kWh/MT</span>
                  </div>
                  <div className="flex items-center gap-space-xs mt-auto pt-space-sm">
                    <button
                      onClick={() => {
                        showScreenToast("Sample FFA: 1.18% confirmed by digital titrator. Quality PASS.");
                      }}
                      className="flex-1 py-1.5 px-space-sm rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors"
                      type="button"
                    >
                      Sample FFA
                    </button>
                    <button
                      onClick={() => {
                        showScreenToast("Cake Density: 640 kg/m³. Defatted meal ready for poultry feed blending.");
                      }}
                      className="flex-1 py-1.5 px-space-sm rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors"
                      type="button"
                    >
                      Cake Density
                    </button>
                    <button
                      onClick={() => {
                        showScreenToast("Tanker Dispatch booked: 4.75 MT Crude Soya Oil scheduled for Sagamu refinery.");
                      }}
                      className="py-1.5 px-space-sm rounded-lg bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary transition-colors"
                      type="button"
                    >
                      Tanker Dispatch
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-xl">
          <div className="lg:col-span-7 flex flex-col gap-space-lg">
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-headline-md text-headline-md text-primary font-bold">Industrial Batch Quality Assurance &amp; Assay Summary</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Multi-stage testing certified under NAFDAC / ISO 22000 hygiene and chemical guidelines.</p>
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-mono">
                  <div className="p-2.5 rounded bg-surface-container-low">
                    <span className="text-on-surface-variant block">Aflatoxin B1/Total:</span>
                    <span className="text-secondary font-bold text-sm">&lt;2.0 ppb (Safe limit 10 ppb)</span>
                  </div>
                  <div className="p-2.5 rounded bg-surface-container-low">
                    <span className="text-on-surface-variant block">Cyanogenic Potential:</span>
                    <span className="text-secondary font-bold text-sm">&lt;10 mg/kg (Safe)</span>
                  </div>
                  <div className="p-2.5 rounded bg-surface-container-low">
                    <span className="text-on-surface-variant block">Heavy Metals (Lead/Arsenic):</span>
                    <span className="text-secondary font-bold text-sm">Non-Detectable</span>
                  </div>
                  <div className="p-2.5 rounded bg-surface-container-low">
                    <span className="text-on-surface-variant block">Total Viable Plate Count:</span>
                    <span className="text-primary font-bold text-sm">&lt;1,000 CFU/g</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-space-sm mt-4">
                <button
                  onClick={handleDownloadCoA}
                  className="w-full sm:flex-1 py-2 px-space-md rounded-lg bg-surface-container text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1"
                  type="button"
                >
                  <Icon name="file_download" className="text-[16px]" />
                  <span>Download Lab CoA (JSON/PDF)</span>
                </button>
                <button
                  onClick={() => setIsAuditModalOpen(true)}
                  className="w-full sm:flex-1 py-2 px-space-md rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold hover:bg-primary transition-colors flex items-center justify-center gap-1"
                  type="button"
                >
                  <Icon name="assignment_turned_in" className="text-[16px]" />
                  <span>Audit Inspection</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full p-space-md rounded-xl bg-surface-container-low shadow-sm flex flex-col md:flex-row items-center justify-between gap-space-md text-on-surface-variant font-body-sm text-body-sm">
          <div className="flex flex-wrap items-center gap-space-md">
            <div className="flex items-center gap-space-xs">
              <Icon name="verified" className="text-secondary text-[18px]" />
              <span className="font-label-md text-label-md text-on-surface font-semibold">SON MANCAP &amp; NAFDAC Certified Node</span>
            </div>
            <div className="flex items-center gap-space-xs">
              <Icon name="sync_saved_locally" className="text-secondary text-[18px]" />
              <span className="font-label-sm text-label-sm">PowerSync Operational (Edge DB Active)</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-space-md">
            <div className="flex items-center gap-space-xs font-label-sm text-label-sm">
              <Icon name="sms" className="text-tertiary-container text-[18px]" />
              <span>Termii SMS Gateway: ₦148,250.00 Balance</span>
            </div>
            <div className="font-label-sm text-label-sm text-outline">CultivaNode OS v4.2.1-savanna</div>
          </div>
        </section>
      </div>

      {/* MODAL 1: Log Raw Material Intake */}
      {isIntakeModalOpen && (
        <ScreenDialog
          title="Log Raw Agricultural Material Intake"
          subtitle="Record weighbridge arrival slip and NIR assay parameters"
          onClose={() => setIsIntakeModalOpen(false)}
          panel={
            <form onSubmit={handleLogIntake} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-on-surface">Commodity Stream</label>
                <select
                  value={intakeCommodity}
                  onChange={(e) => setIntakeCommodity(e.target.value)}
                  className="w-full p-2 rounded border border-outline bg-surface-container-low text-on-surface focus:border-primary focus:outline-none"
                >
                  <option value="Cassava Roots (TME-419)">Cassava Roots (TME-419)</option>
                  <option value="Paddy Rice (Faro 44 Long-Grain)">Paddy Rice (Faro 44 Long-Grain)</option>
                  <option value="Yellow Soybean (TGX-1448E)">Yellow Soybean (TGX-1448E)</option>
                  <option value="Feed Maize (SAMMAZ-52)">Feed Maize (SAMMAZ-52)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Net Intake Volume (MT)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={intakeVolume}
                    onChange={(e) => setIntakeVolume(e.target.value)}
                    className="w-full p-2 rounded border border-outline bg-surface-container-low text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Lab Moisture / Starch Spec</label>
                  <input
                    type="text"
                    required
                    value={intakeMoisture}
                    onChange={(e) => setIntakeMoisture(e.target.value)}
                    className="w-full p-2 rounded border border-outline bg-surface-container-low text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-on-surface">Originating Farmer Cluster</label>
                <input
                  type="text"
                  required
                  value={intakeSupplier}
                  onChange={(e) => setIntakeSupplier(e.target.value)}
                  className="w-full p-2 rounded border border-outline bg-surface-container-low text-on-surface focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <ScreenDialogClose onClick={() => setIsIntakeModalOpen(false)}>
                  Cancel
                </ScreenDialogClose>
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-primary text-on-primary font-semibold hover:bg-primary-container"
                >
                  Register Intake Ticket
                </button>
              </div>
            </form>
          }
        />
      )}

      {/* MODAL 2: Schedule Processing Run */}
      {isScheduleRunModalOpen && (
        <ScreenDialog
          title="Schedule Industrial Processing Run"
          subtitle="Dispatch operational line batch with targeted recovery ratio"
          onClose={() => setIsScheduleRunModalOpen(false)}
          panel={
            <form onSubmit={handleScheduleRun} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-on-surface">Target Processing Line</label>
                <select
                  value={runLine}
                  onChange={(e) => setRunLine(e.target.value)}
                  className="w-full p-2 rounded border border-outline bg-surface-container-low text-on-surface focus:border-primary focus:outline-none"
                >
                  <option value="Line A: Flash Dryer & Centrifuge (Cassava Starch)">Line A: Flash Dryer &amp; Centrifuge (Cassava Starch)</option>
                  <option value="Line B: Rice Milling & Optical Sorter (Faro 44)">Line B: Rice Milling &amp; Optical Sorter (Faro 44)</option>
                  <option value="Line C: Soya Screw Expeller (Crude Oil & Cake)">Line C: Soya Screw Expeller (Crude Oil &amp; Cake)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Feedstock Volume (MT)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={runTargetMT}
                    onChange={(e) => setRunTargetMT(e.target.value)}
                    className="w-full p-2 rounded border border-outline bg-surface-container-low text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Operating Shift</label>
                  <select
                    value={runShift}
                    onChange={(e) => setRunShift(e.target.value)}
                    className="w-full p-2 rounded border border-outline bg-surface-container-low text-on-surface focus:border-primary focus:outline-none"
                  >
                    <option value="Morning Shift (06:00 - 14:00)">Morning Shift (06:00 - 14:00)</option>
                    <option value="Afternoon Shift (14:00 - 22:00)">Afternoon Shift (14:00 - 22:00)</option>
                    <option value="Night Shift (22:00 - 06:00)">Night Shift (22:00 - 06:00)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <ScreenDialogClose onClick={() => setIsScheduleRunModalOpen(false)}>
                  Cancel
                </ScreenDialogClose>
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-primary text-on-primary font-semibold hover:bg-primary-container"
                >
                  Authorize Processing Run
                </button>
              </div>
            </form>
          }
        />
      )}

      {/* MODAL 3: Telemetry Detail */}
      {activeTelemetryModal && (
        <ScreenDialog
          title={activeTelemetryModal.title}
          subtitle={activeTelemetryModal.subtitle}
          onClose={() => setActiveTelemetryModal(null)}
          panel={
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface-container-low">
                {activeTelemetryModal.content}
              </div>
              <div className="flex justify-end pt-2">
                <ScreenDialogClose onClick={() => setActiveTelemetryModal(null)}>
                  Close
                </ScreenDialogClose>
              </div>
            </div>
          }
        />
      )}

      {/* MODAL 4: Audit Inspection */}
      {isAuditModalOpen && (
        <ScreenDialog
          title="Regulatory & Food Safety Audit Inspection"
          subtitle="NAFDAC & Standards Organisation of Nigeria (SON) compliance docket"
          onClose={() => setIsAuditModalOpen(false)}
          panel={
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-surface-container-low space-y-1 font-mono">
                <div><strong>Inspection Standard:</strong> ISO 22000:2018 Food Safety Management</div>
                <div><strong>Audit Agency:</strong> NAFDAC Agro-Allied Directorate (Lagos Zonal)</div>
                <div><strong>Hazard Analysis Critical Control Point (HACCP):</strong> CCP-1 &amp; CCP-2 Validated</div>
                <div><strong>Status:</strong> COMPLIANT - ZERO SANCTIONS</div>
              </div>
              <div className="flex justify-end pt-2">
                <ScreenDialogClose onClick={() => setIsAuditModalOpen(false)}>
                  Close
                </ScreenDialogClose>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
}
