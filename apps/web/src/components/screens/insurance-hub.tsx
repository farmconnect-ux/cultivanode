"use client";

// Ported from the "insurance_risk_underwriting_9.3" design.
import { useState } from "react";
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogClose, showScreenToast } from "@/components/ds/screen-dialog";
import { downloadFile } from "@/lib/download";
import type { ScreenProps } from "./types";

export function InsuranceHub(_props: ScreenProps) {
  const [filterTab, setFilterTab] = useState<"all" | "triage" | "breach" | "adjuster" | "settled">("all");

  // Modals
  const [isUnderwriteModalOpen, setIsUnderwriteModalOpen] = useState(false);
  const [isLossBatchModalOpen, setIsLossBatchModalOpen] = useState(false);
  const [isSettledClaimsModalOpen, setIsSettledClaimsModalOpen] = useState(false);
  const [activeInspectModal, setActiveInspectModal] = useState<{ title: string; subtitle: string; content: React.ReactNode } | null>(null);

  // Policy Payout Execution State
  const [payout105Authorized, setPayout105Authorized] = useState(false);
  const [adjusterDispatched, setAdjusterDispatched] = useState(false);

  // New Policy Form States
  const [policyCoop, setPolicyCoop] = useState("Iseyin Farmers Union");
  const [policyCrop, setPolicyCrop] = useState("Yellow Maize (SAMMAZ-52)");
  const [policyArea, setPolicyArea] = useState("150");
  const [policySumInsured, setPolicySumInsured] = useState("45000000");
  const [policyType, setPolicyType] = useState("Area Yield Index (AYII)");

  const handleExportRegistry = () => {
    const csv = [
      "Policy_ID,Insured_Entity,LGA_State,Crop_Type,Area_Ha,Sum_Insured_NGN,Premium_Rate,Policy_Type,Status",
      "POL-INS-2026-104,Adekunle Farmland Coop,Iseyin Oyo,Maize SAMMAZ-52,42.5,18900000,5.8%,Area Yield (AYII),Active (Healthy)",
      "POL-INS-2026-105,Oke-Ogun Soya Alliance,Saki West Oyo,Soybean TGX-1448E,220.0,74800000,6.2%,Parametric Drought,Breach Triggered",
      "POL-INS-2026-106,Egba Rice Syndicate,Ogun Central,Paddy Rice Faro-44,110.0,9200000,6.5%,Multi-Peril (MPCI),Adjuster Survey",
      "POL-INS-2026-107,Ado-Awaye Outgrowers,Ibarapa Oyo,Cassava TME-419,85.0,22000000,4.9%,Transit Rider,Active (Zero Breaches)",
    ].join("\n");
    downloadFile(csv, `NAICOM_Actuarial_Insurance_Registry_${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
    showScreenToast("Exported NAICOM Actuarial Registry (.csv)");
  };

  const handleExportBreachReport = () => {
    const report = {
      reportType: "Parametric Breach & Indemnity Calculation Docket",
      policyReference: "#POL-INS-2026-105",
      underwriter: "Leadway Assurance Company Ltd / NAICOM Regulated",
      insuredEntity: "Oke-Ogun Soya Alliance Cooperative",
      location: "Saki West, Oyo State (8.6672° N, 3.3934° E)",
      parametricBreachDetectedAt: "2026-03-29T04:30:00Z",
      satellites: "Copernicus Sentinel-2 VHR & NiMet Synoptic Station #65217",
      consecutiveDryDays: 19,
      dryDayThreshold: 18,
      ndviBiomassStressIndex: "-34%",
      grossIndemnityNGN: 13310000,
      deductibleRate: "5%",
      netPayableNGN: 12644500,
      disbursementRail: "NIBSS Instant Payment to Zenith Cooperative Custody Escrow",
    };
    downloadFile(JSON.stringify(report, null, 2), `Parametric_Breach_Report_POL_105.json`, "application/json");
    showScreenToast("Exported Parametric Breach Report (JSON).");
  };

  const handleUnderwritePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUnderwriteModalOpen(false);
    showScreenToast(`Underwrote Policy for ${policyCoop}: ₦${Number(policySumInsured).toLocaleString()} Sum Insured (${policyType}).`);
  };

  const handleAuthorizePayout = () => {
    setPayout105Authorized(true);
    showScreenToast("Signed with multi-sig key & disbursed ₦12.65M indemnity via NIBSS to Oke-Ogun Soya Alliance.");
  };

  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md mb-space-lg bg-surface-container-lowest p-space-md rounded-xl shadow-sm">
          <div className="flex flex-wrap items-center gap-space-sm">
            <div className="flex items-center gap-1.5 px-space-sm py-1 rounded bg-primary-container text-on-primary font-label-md">
              <Icon name="verified_user" className="text-[16px] text-primary-fixed" />
              <span>NAICOM Regulated Underwriting Desk</span>
            </div>
            <div className="flex items-center gap-1.5 px-space-sm py-1 rounded bg-surface-container-high text-on-surface font-label-md">
              <Icon name="handshake" className="text-[16px] text-secondary" />
              <span>Leadway AgriSure Parametric Gateway</span>
            </div>
            <div className="flex items-center gap-1.5 px-space-sm py-1 rounded bg-secondary-fixed text-on-secondary-fixed font-label-md">
              <Icon name="satellite_alt" className="text-[16px] text-secondary" />
              <span>NiMet &amp; Sentinel-2 Sync Active</span>
            </div>
            <div className="flex items-center gap-1.5 px-space-sm py-1 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-md">
              <Icon name="policy" className="text-[16px] text-tertiary-container" />
              <span>NAIC &amp; NIRSAL Multi-Peril Shield</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-space-sm">
            {_props.slots?.actions ?? (
              <>
                <button
                  onClick={handleExportRegistry}
                  className="flex items-center gap-1.5 px-space-md py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-lg"
                  type="button"
                >
                  <Icon name="table_view" className="text-[18px]" />
                  <span>Export Actuarial Registry (.csv)</span>
                </button>
                <button
                  onClick={() => setIsLossBatchModalOpen(true)}
                  className="flex items-center gap-1.5 px-space-md py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-lg"
                  type="button"
                >
                  <Icon name="troubleshoot" className="text-[18px] text-tertiary-container" />
                  <span>Loss Assessment Batch</span>
                </button>
                <button
                  onClick={() => setIsUnderwriteModalOpen(true)}
                  className="flex items-center gap-1.5 px-space-md py-1.5 rounded-lg bg-primary-container text-on-primary hover:bg-primary transition-colors font-label-lg shadow-sm"
                  type="button"
                >
                  <Icon name="add_moderator" className="text-[18px]" />
                  <span>+ Underwrite New Policy</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-space-md mb-space-lg">
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant font-label-md">
              <span>TOTAL SUM INSURED</span>
              <Icon name="account_balance" className="text-[18px] text-secondary" />
            </div>
            <div className="my-space-sm">
              <div className="font-headline-lg text-headline-lg text-on-surface font-bold">₦814.20M</div>
              <div className="flex items-center gap-1 text-on-secondary-container font-label-sm mt-0.5">
                <Icon name="trending_up" className="text-[14px]" />
                <span>+22.4% YoY</span>
              </div>
            </div>
            <div className="text-on-surface-variant font-body-sm text-[11px] leading-tight">1,840 Ha · 32 Estates &amp; 46 Co-ops</div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant font-label-md">
              <span>GROSS WRITTEN PREMIUM</span>
              <Icon name="receipt_long" className="text-[18px] text-primary" />
            </div>
            <div className="my-space-sm">
              <div className="font-headline-lg text-headline-lg text-on-surface font-bold">₦48.85M</div>
              <div className="text-on-surface-variant font-label-sm mt-0.5">6.00% Avg Rate</div>
            </div>
            <div className="text-on-surface-variant font-body-sm text-[11px] leading-tight">50% Federal NAICOM Subsidy applied</div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant font-label-md">
              <span>LOSS RATIO (T12M)</span>
              <Icon name="analytics" className="text-[18px] text-secondary" />
            </div>
            <div className="my-space-sm">
              <div className="font-headline-lg text-headline-lg text-secondary font-bold">14.2%</div>
              <div className="text-on-surface-variant font-label-sm mt-0.5">Benchmark ceiling: 45.0%</div>
            </div>
            <div className="text-on-surface-variant font-body-sm text-[11px] leading-tight">Precision telemetry mitigation</div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant font-label-md">
              <span>ACTIVE POLICIES</span>
              <Icon name="contract" className="text-[18px] text-primary" />
            </div>
            <div className="my-space-sm">
              <div className="font-headline-lg text-headline-lg text-on-surface font-bold">218</div>
              <div className="text-on-surface-variant font-label-sm mt-0.5">142 AYII · 58 Weather · 18 MPCI</div>
            </div>
            <div className="text-on-surface-variant font-body-sm text-[11px] leading-tight">Oyo, Ogun &amp; Osun operational belts</div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant font-label-md">
              <span>TRIGGER WATCH</span>
              <Icon name="radar" className="text-[18px] text-tertiary-container" />
            </div>
            <div className="my-space-sm">
              <div className="font-headline-lg text-headline-lg text-tertiary-container font-bold">3 Clusters</div>
              <div className="text-on-tertiary-fixed-variant font-label-sm mt-0.5 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-tertiary-container animate-pulse" />
                <span>1 Queued for fast payout</span>
              </div>
            </div>
            <div className="text-on-surface-variant font-body-sm text-[11px] leading-tight">Oke-Ogun, Ibarapa, Ogun Basin</div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant font-label-md">
              <span>SETTLED CLAIMS SLA</span>
              <Icon name="speed" className="text-[18px] text-secondary" />
            </div>
            <div className="my-space-sm">
              <div className="font-headline-lg text-headline-lg text-on-surface font-bold">₦6.40M</div>
              <div className="text-on-secondary-container font-label-sm mt-0.5">Avg. 4.2 Days cycle</div>
            </div>
            <div className="text-on-surface-variant font-body-sm text-[11px] leading-tight">Satellite index breach to wallet payout</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-lg items-start">
          <div className="lg:col-span-7 flex flex-col gap-space-md">
            <div className="bg-surface-container-lowest p-space-sm rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-space-sm">
              <div className="flex flex-wrap items-center gap-1">
                {[
                  { id: "all", label: "All Active (218)" },
                  { id: "triage", label: "Underwriting Triage (14)" },
                  { id: "breach", label: "Parametric Breach Queue (4)", isBreach: true },
                  { id: "adjuster", label: "Field Adjuster Survey (2)" },
                  { id: "settled", label: "Settled (38)" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setFilterTab(t.id as any);
                      showScreenToast(`Viewing policy group: ${t.label}`);
                    }}
                    className={`px-space-md py-1.5 rounded-lg font-label-md transition-colors ${
                      filterTab === t.id
                        ? "bg-primary-container text-on-primary font-semibold shadow-sm"
                        : t.isBreach
                        ? "bg-error-container text-on-error-container font-semibold"
                        : "text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                    type="button"
                  >
                    {t.isBreach && <span className="w-1.5 h-1.5 rounded-full bg-error inline-block mr-1" />}
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 text-on-surface-variant font-label-sm px-space-xs">
                <span>Sort: Risk Exposure</span>
                <Icon name="arrow_drop_down" className="text-[16px]" />
              </div>
            </div>

            {(filterTab === "all" || filterTab === "triage") && (
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-start justify-between gap-space-sm mb-space-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold">#POL-INS-2026-104</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-secondary-fixed text-on-secondary-fixed flex items-center gap-1">
                        <Icon name="check_circle" className="text-[14px] text-secondary" /> AYII Policy Healthy
                      </span>
                    </div>
                    <div className="text-on-surface-variant font-body-sm mt-0.5">Insured: <strong className="text-on-surface font-semibold">Adekunle Farmland Cooperative</strong> · Iseyin LGA, 42.5 Ha Maize</div>
                  </div>
                  <div className="text-right">
                    <div className="text-on-surface font-headline-sm font-bold">₦18,900,000</div>
                    <div className="text-secondary font-label-sm font-semibold">Premium: ₦1,096,200 (50% Subsidy)</div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs text-body-sm">
                  <div className="flex items-center gap-2 text-on-surface-variant font-label-sm">
                    <Icon name="check_circle" className="text-[16px] text-secondary" />
                    <span>Premium settled via Zenith Escrow tranche · NiMet Station #65215 sync confirmed</span>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <button
                      onClick={() =>
                        setActiveInspectModal({
                          title: "Telemetry Log: #POL-INS-2026-104",
                          subtitle: "Adekunle Farmland Cooperative (42.5 Ha)",
                          content: (
                            <div className="space-y-2 text-sm">
                              <div><strong>NiMet Synoptic Station:</strong> Iseyin #65215 (Rainfall: 142mm MTD)</div>
                              <div><strong>Sentinel-2 NDVI Biomass:</strong> 0.78 (Optimal Green Canopy)</div>
                              <div><strong>Soil Moisture Deficit Index:</strong> 8.2% (Well within normal range)</div>
                              <div><strong>Breach Probability:</strong> &lt;2.1% (Low risk)</div>
                            </div>
                          ),
                        })
                      }
                      className="px-space-md py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md"
                      type="button"
                    >
                      Telemetry Log
                    </button>
                    <button
                      onClick={() =>
                        setActiveInspectModal({
                          title: "Policy Dossier: #POL-INS-2026-104",
                          subtitle: "Leadway AgriSure Area Yield Index Policy",
                          content: (
                            <div className="space-y-2 text-sm">
                              <div><strong>Policy Holder:</strong> Adekunle Farmland Cooperative</div>
                              <div><strong>Sum Insured:</strong> ₦18,900,000.00</div>
                              <div><strong>Underwriting Under:</strong> NAICOM Regulated Framework</div>
                              <div><strong>Federal Subsidy:</strong> 50% paid via NAIC / NIRSAL</div>
                            </div>
                          ),
                        })
                      }
                      className="px-space-md py-1 rounded bg-primary-container text-on-primary hover:bg-primary font-label-md"
                      type="button"
                    >
                      Policy Dossier
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(filterTab === "all" || filterTab === "breach") && (
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-md ring-2 ring-error">
                <div className="flex flex-wrap items-start justify-between gap-space-sm mb-space-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold">#POL-INS-2026-105</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-error text-on-error flex items-center gap-1 animate-pulse">
                        <Icon name="warning" className="text-[14px]" /> PARAMETRIC BREACH ALERT · PAYOUT QUEUED
                      </span>
                    </div>
                    <div className="text-on-surface-variant font-body-sm mt-0.5">Insured: <strong className="text-on-surface font-semibold">Oke-Ogun Soya Alliance Co-op</strong> · Saki West, 220 Ha (310 Members)</div>
                  </div>
                  <div className="text-right">
                    <div className="text-on-surface font-headline-sm font-bold">₦74,800,000</div>
                    <div className="text-error font-label-sm font-semibold">Pre-calculated Indemnity: ₦13.31M</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm p-space-sm bg-error-container/30 rounded-lg my-space-sm">
                  <div>
                    <div className="text-[11px] font-label-sm text-on-surface-variant uppercase tracking-wider">Trigger Threshold</div>
                    <div className="text-on-surface font-body-sm font-semibold">&lt;1.40 MT/Ha Yield</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-label-sm text-on-surface-variant uppercase tracking-wider">Dry Spell Status</div>
                    <div className="text-error font-body-sm font-semibold">19 Dry Days (CDD &gt; 18)</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-label-sm text-on-surface-variant uppercase tracking-wider">NDVI Deficit (Sec 4)</div>
                    <div className="text-error font-body-sm font-semibold">0.42 (Stress Index -34%)</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-label-sm text-on-surface-variant uppercase tracking-wider">Est. Yield Deficit</div>
                    <div className="text-on-surface font-body-sm font-semibold">17.8% Shortfall (1.15 MT)</div>
                  </div>
                </div>
                <p className="text-body-sm text-on-surface-variant leading-relaxed">Autonomous smart covenant triggered at 04:30 UTC following Copernicus Sentinel-2 moisture index inversion across Saki West quadrant. Corroborated by NiMet synoptic station (Saki #65217).</p>
                <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-sm mt-space-xs">
                  <div className="flex items-center gap-1.5 text-error font-label-sm">
                    <Icon name="verified" className="text-[16px]" />
                    <span>Multi-sig consensus: Leadway Agro Underwriter + NAICOM Token validated</span>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <button
                      onClick={() => {
                        setAdjusterDispatched(true);
                        showScreenToast("Chartered Agronomic Loss Adjuster dispatched to Saki West sector.");
                      }}
                      className="px-space-md py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md"
                      type="button"
                    >
                      {adjusterDispatched ? "Adjuster Dispatched" : "Dispatch Field Adjuster"}
                    </button>
                    <button
                      onClick={handleAuthorizePayout}
                      disabled={payout105Authorized}
                      className="px-space-md py-1.5 rounded-lg bg-tertiary-container text-on-primary hover:opacity-90 font-label-md font-semibold flex items-center gap-1 shadow-sm disabled:opacity-50"
                      type="button"
                    >
                      <Icon name="payments" className="text-[16px]" />
                      <span>{payout105Authorized ? "Indemnity Disbursed (₦12.65M)" : "Authorize Payout (₦12.65M Net)"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(filterTab === "all" || filterTab === "adjuster") && (
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-start justify-between gap-space-sm mb-space-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold">#POL-INS-2026-106</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-container-highest text-on-surface flex items-center gap-1">
                        <Icon name="water_damage" className="text-[14px] text-tertiary" /> Multi-Peril Crop Insurance (MPCI) · Riverine Deluge
                      </span>
                    </div>
                    <div className="text-on-surface-variant font-body-sm mt-0.5">Insured: <strong className="text-on-surface font-semibold">Egba Rice Growers Syndicate</strong> · Ogun Central, 110 Ha Lowland Faro-44</div>
                  </div>
                  <div className="text-right">
                    <div className="text-on-surface font-headline-sm font-bold">₦9,200,000</div>
                    <div className="text-on-surface-variant font-label-sm">Claimed Inundation Loss</div>
                  </div>
                </div>
                <div className="p-space-sm bg-surface-container-low rounded-lg my-space-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-sm">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                      <Icon name="assignment_ind" className="text-[24px]" />
                    </div>
                    <div>
                      <div className="font-label-md text-on-surface font-semibold">Engr. Babatunde Jinadu (COREN-9102)</div>
                      <div className="text-[12px] text-on-surface-variant">Chartered Agronomic Loss Adjuster · Assigned 18 Feb 2026</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface-variant font-label-sm">
                    <Icon name="photo_camera" className="text-[16px] text-secondary" />
                    <span>18 Geotagged Drones + Watermark Logs (0.65m)</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs text-body-sm">
                  <div className="text-on-surface-variant font-label-sm">112mm rain logged at Abeokuta radar · Ogun-Osun River Basin breach under review</div>
                  <div className="flex items-center gap-space-xs">
                    <button
                      onClick={() =>
                        setActiveInspectModal({
                          title: "Secondary Soil Moisture Audit",
                          subtitle: "Egba Rice Lowland Basin (Ogun River)",
                          content: (
                            <div className="space-y-2 text-sm">
                              <div><strong>Inundation Depth:</strong> 0.65m above root collar</div>
                              <div><strong>Duration:</strong> 72 hours continuous submersion</div>
                              <div><strong>Estimated Survival Rate:</strong> 34% (Submergence tolerance breached)</div>
                            </div>
                          ),
                        })
                      }
                      className="px-space-md py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md"
                      type="button"
                    >
                      Secondary Soil Audit
                    </button>
                    <button
                      onClick={() =>
                        setActiveInspectModal({
                          title: "Adjuster Drone Survey: Engr. Jinadu",
                          subtitle: "18 Orthomosaic Drone Flight Logs",
                          content: (
                            <div className="space-y-2 text-sm">
                              <div><strong>Survey Date:</strong> 2026-02-18</div>
                              <div><strong>Total Damaged Acreage:</strong> 44.2 Hectares of 110 Ha</div>
                              <div><strong>Loss Adjuster Recommendation:</strong> Compensate ₦9,200,000</div>
                            </div>
                          ),
                        })
                      }
                      className="px-space-md py-1 rounded bg-primary-container text-on-primary hover:bg-primary font-label-md"
                      type="button"
                    >
                      Review Adjuster Survey
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(filterTab === "all" || filterTab === "settled") && (
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-start justify-between gap-space-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold">#POL-INS-2026-107</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-secondary-fixed text-on-secondary-fixed flex items-center gap-1">
                        <Icon name="local_shipping" className="text-[14px]" /> Transit &amp; Tuber Rot Rider (Psaltry Offtake)
                      </span>
                    </div>
                    <div className="text-on-surface-variant font-body-sm mt-0.5">Insured: <strong className="text-on-surface font-semibold">Ado-Awaye Outgrowers Union</strong> · ₦22,000,000 Sum Insured · 100% Intact</div>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <span className="px-space-sm py-1 rounded bg-surface-container font-label-sm text-on-surface">No Breaches Recorded</span>
                    <button
                      onClick={() =>
                        setActiveInspectModal({
                          title: "Transit & Haulage Telematics",
                          subtitle: "Ado-Awaye to Factory Gate Transit Route",
                          content: (
                            <div className="space-y-2 text-sm">
                              <div><strong>Active Trucks:</strong> 4 Tippers En Route</div>
                              <div><strong>Average Transit Duration:</strong> 42 minutes</div>
                              <div><strong>Tuber Root Age:</strong> 8 hours (Ultra fresh)</div>
                            </div>
                          ),
                        })
                      }
                      className="px-space-md py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md"
                      type="button"
                    >
                      View Haulage Sensors
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 flex flex-col gap-space-md">
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-sm">Autonomous Parametric Settlement Docket</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">Autonomous verification docket executing Leadway parametric payouts via NIBSS clearing.</p>
              <div className="flex flex-col sm:flex-row gap-space-sm">
                <button
                  onClick={handleAuthorizePayout}
                  disabled={payout105Authorized}
                  className="flex-1 py-2.5 px-space-md rounded-lg bg-primary-container text-on-primary hover:bg-primary font-label-lg font-bold flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
                  type="button"
                >
                  <Icon name="account_balance_wallet" className="text-[20px]" />
                  <span>{payout105Authorized ? "Disbursed via NIBSS" : "Sign & Disburse ₦12.65M via NIBSS"}</span>
                </button>
                <button
                  onClick={handleExportBreachReport}
                  className="py-2.5 px-space-md rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg font-semibold flex items-center justify-center gap-1"
                  type="button"
                >
                  <Icon name="picture_as_pdf" className="text-[18px]" />
                  <span>Export Report</span>
                </button>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md">
              <div className="flex items-center justify-between mb-space-sm">
                <div className="font-label-md text-on-surface font-semibold flex items-center gap-1.5">
                  <Icon name="satellite" className="text-secondary text-[18px]" />
                  <span>Sentinel-2 Pass Schedule &amp; Resolution</span>
                </div>
                <span className="text-[11px] text-on-surface-variant">5-Day Constellation Orbit</span>
              </div>
              <div className="text-body-sm text-on-surface-variant mb-space-sm leading-snug">
                Next multispectral high-resolution orbit pass over Oyo Western Agricultural Basin scheduled for <strong>Tomorrow, 10:14 AM WAT</strong> (Cloud coverage forecast: &lt;12%).
              </div>
              <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden flex">
                <div className="bg-secondary h-full" style={{ width: "78%" }} />
                <div className="bg-tertiary-container h-full" style={{ width: "22%" }} />
              </div>
              <div className="flex justify-between text-[11px] font-label-sm text-on-surface-variant mt-1">
                <span>Oyo Zone Cloud Cleared (78%)</span>
                <span>Intermittent Cloud Mask (22%)</span>
              </div>
            </div>

            <div className="p-space-md rounded-xl bg-surface-container-low shadow-sm flex items-center justify-between">
              <span className="text-sm font-semibold">Historical Settlement Records:</span>
              <button
                onClick={() => setIsSettledClaimsModalOpen(true)}
                className="text-primary font-bold hover:underline text-xs"
                type="button"
              >
                View 38 Settled Historical Claims
              </button>
            </div>
          </div>
        </div>

        {/* MODAL 1: Underwrite New Policy */}
        {isUnderwriteModalOpen && (
          <ScreenDialog
            title="Underwrite New Agricultural Insurance Policy"
            subtitle="Originate Leadway AgriSure parametric or multi-peril policy"
            onClose={() => setIsUnderwriteModalOpen(false)}
            panel={
              <form onSubmit={handleUnderwritePolicy} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Insured Cooperative / Farm Estate</label>
                  <input
                    type="text"
                    required
                    value={policyCoop}
                    onChange={(e) => setPolicyCoop(e.target.value)}
                    className="w-full p-2 rounded border border-outline bg-surface-container-low text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-bold text-on-surface">Crop Enterprise</label>
                    <input
                      type="text"
                      required
                      value={policyCrop}
                      onChange={(e) => setPolicyCrop(e.target.value)}
                      className="w-full p-2 rounded border border-outline bg-surface-container-low text-on-surface focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-on-surface">Area (Hectares)</label>
                    <input
                      type="number"
                      required
                      value={policyArea}
                      onChange={(e) => setPolicyArea(e.target.value)}
                      className="w-full p-2 rounded border border-outline bg-surface-container-low text-on-surface focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-bold text-on-surface">Total Sum Insured (₦)</label>
                    <input
                      type="number"
                      required
                      value={policySumInsured}
                      onChange={(e) => setPolicySumInsured(e.target.value)}
                      className="w-full p-2 rounded border border-outline bg-surface-container-low text-on-surface focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-on-surface">Policy Architecture</label>
                    <select
                      value={policyType}
                      onChange={(e) => setPolicyType(e.target.value)}
                      className="w-full p-2 rounded border border-outline bg-surface-container-low text-on-surface focus:border-primary focus:outline-none"
                    >
                      <option value="Area Yield Index (AYII)">Area Yield Index (AYII)</option>
                      <option value="Parametric Weather Index">Parametric Weather Index</option>
                      <option value="Multi-Peril Crop Insurance (MPCI)">Multi-Peril Crop Insurance (MPCI)</option>
                      <option value="Transit & Storage Rot Rider">Transit &amp; Storage Rot Rider</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <ScreenDialogClose onClick={() => setIsUnderwriteModalOpen(false)}>
                    Cancel
                  </ScreenDialogClose>
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-lg bg-primary text-on-primary font-semibold hover:bg-primary-container"
                  >
                    Confirm Policy Origination
                  </button>
                </div>
              </form>
            }
          />
        )}

        {/* MODAL 2: Loss Assessment Batch */}
        {isLossBatchModalOpen && (
          <ScreenDialog
            title="Loss Assessment Batch Processing"
            subtitle="Automated satellite trigger scan across all 218 active underwriting polygons"
            onClose={() => setIsLossBatchModalOpen(false)}
            panel={
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-surface-container-low space-y-1 font-mono">
                  <div><strong>Total Active Polygons Scanned:</strong> 218</div>
                  <div><strong>Active Breaches:</strong> 1 Critical (Saki West Soya Alliance)</div>
                  <div><strong>Pending Adjuster Surveys:</strong> 2 Lowland Farms</div>
                  <div><strong>Total Calculated Indemnity:</strong> ₦22,510,000.00</div>
                </div>
                <div className="flex justify-end pt-2">
                  <ScreenDialogClose onClick={() => setIsLossBatchModalOpen(false)}>
                    Close
                  </ScreenDialogClose>
                </div>
              </div>
            }
          />
        )}

        {/* MODAL 3: Settled Claims Modal */}
        {isSettledClaimsModalOpen && (
          <ScreenDialog
            title="Historical Settled Agricultural Claims (38 Total)"
            subtitle="Audited NAICOM & Leadway payout docket with zero defaults"
            onClose={() => setIsSettledClaimsModalOpen(false)}
            panel={
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded bg-surface-container-low flex justify-between items-center">
                  <div>
                    <div className="font-bold">#CLM-2025-091 · Saki Maize Drought</div>
                    <div className="text-[10px] text-on-surface-variant">Settled via NIBSS on 2025-11-12</div>
                  </div>
                  <span className="font-bold text-secondary">₦4,200,000.00</span>
                </div>
                <div className="p-2.5 rounded bg-surface-container-low flex justify-between items-center">
                  <div>
                    <div className="font-bold">#CLM-2025-042 · Ibarapa Cassava Deluge</div>
                    <div className="text-[10px] text-on-surface-variant">Settled via NIBSS on 2025-08-04</div>
                  </div>
                  <span className="font-bold text-secondary">₦2,200,000.00</span>
                </div>
                <div className="flex justify-end pt-2">
                  <ScreenDialogClose onClick={() => setIsSettledClaimsModalOpen(false)}>
                    Close
                  </ScreenDialogClose>
                </div>
              </div>
            }
          />
        )}

        {/* MODAL 4: Detail Modal */}
        {activeInspectModal && (
          <ScreenDialog
            title={activeInspectModal.title}
            subtitle={activeInspectModal.subtitle}
            onClose={() => setActiveInspectModal(null)}
            panel={
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-surface-container-low">
                  {activeInspectModal.content}
                </div>
                <div className="flex justify-end pt-2">
                  <ScreenDialogClose onClick={() => setActiveInspectModal(null)}>
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
