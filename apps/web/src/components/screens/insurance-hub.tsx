// Ported from the "insurance_risk_underwriting_9.3" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";

export function InsuranceHub(_props: ScreenProps) {
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
            <button className="flex items-center gap-1.5 px-space-md py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-lg" type="button">
              <Icon name="table_view" className="text-[18px]" />
              <span>Export Actuarial Registry (.csv)</span>
            </button>
            <button className="flex items-center gap-1.5 px-space-md py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-lg" type="button">
              <Icon name="troubleshoot" className="text-[18px] text-tertiary-container" />
              <span>Loss Assessment Batch</span>
            </button>
            <button className="flex items-center gap-1.5 px-space-md py-1.5 rounded-lg bg-primary-container text-on-primary hover:bg-primary transition-colors font-label-lg shadow-sm" type="button">
              <Icon name="add_moderator" className="text-[18px]" />
              <span>+ Underwrite New Policy</span>
            </button>
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
                <button className="px-space-md py-1.5 rounded-lg bg-primary-container text-on-primary font-label-md font-semibold transition-all shadow-sm" type="button">All Active (218)</button>
                <button className="px-space-md py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-md" type="button">Underwriting Triage (14)</button>
                <button className="px-space-md py-1.5 rounded-lg bg-error-container text-on-error-container font-label-md font-semibold flex items-center gap-1" type="button"><span className="w-1.5 h-1.5 rounded-full bg-error" /> Parametric Breach Queue (4)</button>
                <button className="px-space-md py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-md" type="button">Field Adjuster Survey (2)</button>
                <button className="px-space-md py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-md" type="button">Settled (38)</button>
              </div>
              <div className="flex items-center gap-1 text-on-surface-variant font-label-sm px-space-xs">
                <span>Sort: Risk Exposure</span>
                <Icon name="arrow_drop_down" className="text-[16px]" />
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-start justify-between gap-space-sm mb-space-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold">#POL-INS-2026-104</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-secondary-fixed text-on-secondary-fixed flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Leadway Satellite Drought Parametric</span>
                  </div>
                  <div className="text-on-surface-variant font-body-sm mt-0.5">Insured: <strong className="text-on-surface font-semibold">Iseyin Savanna Cluster</strong> · Quadri Olapade &amp; 310 Maize Outgrowers (140 Ha)</div>
                </div>
                <div className="text-right">
                  <div className="text-on-surface font-headline-sm font-bold">₦58,800,000</div>
                  <div className="text-on-surface-variant font-label-sm">Sum Insured · Premium: ₦3.528M</div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm p-space-sm bg-surface-container-low rounded-lg my-space-sm">
                <div>
                  <div className="text-[11px] font-label-sm text-on-surface-variant uppercase tracking-wider">Trigger Rule</div>
                  <div className="text-on-surface font-body-sm font-semibold">&lt;18mm / 21 Days</div>
                </div>
                <div>
                  <div className="text-[11px] font-label-sm text-on-surface-variant uppercase tracking-wider">Rainfall Recorded</div>
                  <div className="text-secondary font-body-sm font-semibold">24.5mm (Safe)</div>
                </div>
                <div>
                  <div className="text-[11px] font-label-sm text-on-surface-variant uppercase tracking-wider">Sentinel-2 NDVI</div>
                  <div className="text-on-surface font-body-sm font-semibold">0.76 (Canopy Vigorous)</div>
                </div>
                <div>
                  <div className="text-[11px] font-label-sm text-on-surface-variant uppercase tracking-wider">Soil Moisture</div>
                  <div className="text-on-surface font-body-sm font-semibold">38.0% (Optimum)</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs text-body-sm">
                <div className="flex items-center gap-2 text-on-surface-variant font-label-sm">
                  <Icon name="check_circle" className="text-[16px] text-secondary" />
                  <span>Premium settled via Zenith Escrow tranche · NiMet Station #65215 sync confirmed</span>
                </div>
                <div className="flex items-center gap-space-xs">
                  <button className="px-space-md py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md" type="button">Telemetry Log</button>
                  <button className="px-space-md py-1 rounded bg-primary-container text-on-primary hover:bg-primary font-label-md" type="button">Policy Dossier</button>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-md ring-2 ring-error">
              <div className="flex flex-wrap items-start justify-between gap-space-sm mb-space-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold">#POL-INS-2026-105</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-error text-on-error flex items-center gap-1 animate-pulse"><Icon name="warning" className="text-[14px]" /> PARAMETRIC BREACH ALERT · PAYOUT QUEUED</span>
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
                  <button className="px-space-md py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md" type="button">Dispatch Field Adjuster</button>
                  <button className="px-space-md py-1.5 rounded-lg bg-tertiary-container text-on-primary hover:opacity-90 font-label-md font-semibold flex items-center gap-1 shadow-sm" type="button">
                    <Icon name="payments" className="text-[16px]" />
                    <span>Authorize Payout (₦12.65M Net)</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-start justify-between gap-space-sm mb-space-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold">#POL-INS-2026-106</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-container-highest text-on-surface flex items-center gap-1"><Icon name="water_damage" className="text-[14px] text-tertiary" /> Multi-Peril Crop Insurance (MPCI) · Riverine Deluge</span>
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
                  <button className="px-space-md py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md" type="button">Secondary Soil Audit</button>
                  <button className="px-space-md py-1 rounded bg-primary-container text-on-primary hover:bg-primary font-label-md" type="button">Review Adjuster Survey</button>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-start justify-between gap-space-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold">#POL-INS-2026-107</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-secondary-fixed text-on-secondary-fixed flex items-center gap-1"><Icon name="local_shipping" className="text-[14px]" /> Transit &amp; Tuber Rot Rider (Psaltry Offtake)</span>
                  </div>
                  <div className="text-on-surface-variant font-body-sm mt-0.5">Insured: <strong className="text-on-surface font-semibold">Ado-Awaye Outgrowers Union</strong> · ₦22,000,000 Sum Insured · 100% Intact</div>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="px-space-sm py-1 rounded bg-surface-container font-label-sm text-on-surface">No Breaches Recorded</span>
                  <button className="px-space-md py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md" type="button">View Haulage Sensors</button>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 flex flex-col gap-space-md">
            <div className="bg-surface-container-lowest rounded-xl shadow-md p-space-lg">
              <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-low p-space-sm rounded-lg">
                <div className="flex items-center gap-2">
                  <Icon name="gavel" className="text-primary text-[24px]" />
                  <div>
                    <div className="font-headline-sm text-headline-sm text-on-surface font-bold">Actuarial Risk Dossier</div>
                    <div className="font-label-sm text-on-surface-variant">Policy #POL-INS-2026-105 · Oke-Ogun Soya Alliance</div>
                  </div>
                </div>
                <span className="px-2 py-1 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm font-semibold">Stage: Payout Audit</span>
              </div>
              <div className="relative w-full rounded-xl overflow-hidden mb-space-md bg-surface-container">
                <div className="w-full h-44 bg-cover bg-center" data-location="Saki, Oyo State, Nigeria" style={{ backgroundImage: "url('/images/screens/723bcb99ff73.webp')" }} />
                <div className="absolute bottom-2 left-2 right-2 px-space-sm py-1 bg-surface-container-lowest/90 backdrop-blur rounded flex items-center justify-between text-[11px] font-label-sm text-on-surface">
                  <div className="flex items-center gap-1">
                    <Icon name="explore" className="text-[14px] text-secondary" />
                    <span>Saki West Polygon: 8.665°N, 3.385°E</span>
                  </div>
                  <div className="text-tertiary-container font-bold">Sentinel-2 NDVI Anomaly: Sector 4 Deficit</div>
                </div>
              </div>
              <div className="space-y-space-sm mb-space-md">
                <div className="font-label-md text-on-surface font-semibold flex items-center justify-between">
                  <span>REAL-TIME TELEMETRIC TRIGGER VERIFICATION</span>
                  <span className="text-[11px] text-secondary font-semibold">Synced 12 mins ago</span>
                </div>
                <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="water_loss" className="text-[18px] text-tertiary-container" />
                    <div>
                      <div className="font-label-md text-on-surface font-semibold">30-Day Cumulative Rainfall</div>
                      <div className="text-[11px] text-on-surface-variant">Baseline Expectation: 94.0mm</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-headline-sm text-on-surface font-bold text-error">42.1mm</div>
                    <div className="text-[11px] text-error font-semibold">-55.2% Deficit</div>
                  </div>
                </div>
                <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="solar_power" className="text-[18px] text-error" />
                    <div>
                      <div className="font-label-md text-on-surface font-semibold">Consecutive Dry Days (CDD)</div>
                      <div className="text-[11px] text-on-surface-variant">Trigger Covenant Threshold: 18.0 Days</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-headline-sm text-on-surface font-bold text-error">19 Days</div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-error text-on-error">INDEX BREACHED</span>
                  </div>
                </div>
                <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="sensors" className="text-[18px] text-primary" />
                    <div>
                      <div className="font-label-md text-on-surface font-semibold">Surface Soil Moisture</div>
                      <div className="text-[11px] text-on-surface-variant">NiMet Synoptic Saki #65217</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-headline-sm text-on-surface font-bold">14.2%</div>
                    <div className="text-[11px] text-on-surface-variant font-semibold">Wilting Proximity High</div>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container p-space-md rounded-xl mb-space-md">
                <div className="font-label-sm text-on-surface-variant uppercase tracking-wider mb-space-xs font-semibold">Actuarial Payout Formula</div>
                <div className="space-y-1.5 text-body-sm font-label-md text-on-surface">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Total Insured Cluster Valuation:</span>
                    <span>₦74,800,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Coverage Parameter (Tier A AYII):</span>
                    <span>80.00%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Modelled Sector Yield Deficit:</span>
                    <span className="text-error font-semibold">17.80% (1.15 MT vs 1.40 MT)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Less Statutory Deductible (5%):</span>
                    <span className="text-on-surface-variant">-₦665,720</span>
                  </div>
                  <div className="pt-2 flex justify-between font-bold text-headline-sm text-primary">
                    <span>Approved Indemnity:</span>
                    <span className="text-secondary font-bold">₦12,648,680</span>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-low p-space-sm rounded-lg mb-space-md space-y-1 text-[12px]">
                <div className="flex items-center justify-between text-on-surface">
                  <span className="flex items-center gap-1 font-semibold"><Icon name="verified" className="text-[14px] text-secondary" /> Leadway Agro Underwriter PIN:</span>
                  <span className="font-mono text-on-surface-variant">AUTH-LWY-09124-OK</span>
                </div>
                <div className="flex items-center justify-between text-on-surface">
                  <span className="flex items-center gap-1 font-semibold"><Icon name="verified" className="text-[14px] text-secondary" /> NAICOM Regulatory Cert:</span>
                  <span className="font-mono text-on-surface-variant">#NC-AGR-2026-4410</span>
                </div>
                <div className="flex items-center justify-between text-on-surface">
                  <span className="flex items-center gap-1 font-semibold"><Icon name="verified" className="text-[14px] text-secondary" /> Co-op Sovereign Rep OTP:</span>
                  <span className="font-mono text-on-surface-variant">Oke-Ogun Exec Validated</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-space-sm">
                <button className="flex-1 py-2.5 px-space-md rounded-lg bg-primary-container text-on-primary hover:bg-primary font-label-lg font-bold flex items-center justify-center gap-2 transition-all shadow-md" id="payout-action-btn" type="button">
                  <Icon name="account_balance_wallet" className="text-[20px]" />
                  <span>Sign &amp; Disburse ₦12.65M via NIBSS</span>
                </button>
                <button className="py-2.5 px-space-md rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg font-semibold flex items-center justify-center gap-1" type="button">
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
              <div className="text-body-sm text-on-surface-variant mb-space-sm leading-snug">Next multispectral high-resolution orbit pass over Oyo Western Agricultural Basin scheduled for <strong>Tomorrow, 10:14 AM WAT</strong> (Cloud coverage forecast: &lt;12%).</div>
              <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden flex">
                <div className="bg-secondary h-full" style={{ width: "78%" }} />
                <div className="bg-tertiary-container h-full" style={{ width: "22%" }} />
              </div>
              <div className="flex justify-between text-[11px] font-label-sm text-on-surface-variant mt-1">
                <span>Oyo Zone Cloud Cleared (78%)</span>
                <span>Intermittent Cloud Mask (22%)</span>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-space-sm">
                <div className="font-headline-sm text-headline-sm text-on-surface font-bold">Portfolio Risk Mix</div>
                <Icon name="donut_large" className="text-secondary text-[20px]" />
              </div>
              <p className="text-body-sm text-on-surface-variant mb-space-md">Parametric index allocations across South-West Nigeria agro-corridors.</p>
              <div className="space-y-space-md">
                <div>
                  <div className="flex justify-between text-label-sm font-label-sm mb-1 text-on-surface">
                    <span>Drought &amp; Moisture Deficit Index (AYII)</span>
                    <span className="font-bold">48% (₦390.8M)</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden">
                    <div className="bg-primary-container h-full rounded-full" style={{ width: "48%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-label-sm font-label-sm mb-1 text-on-surface">
                    <span>Excess Deluge &amp; Riverine Flood MPCI</span>
                    <span className="font-bold">26% (₦211.7M)</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden">
                    <div className="bg-secondary h-full rounded-full" style={{ width: "26%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-label-sm font-label-sm mb-1 text-on-surface">
                    <span>Pest &amp; Vector Infestation Rider</span>
                    <span className="font-bold">16% (₦130.3M)</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden">
                    <div className="bg-tertiary-container h-full rounded-full" style={{ width: "16%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-label-sm font-label-sm mb-1 text-on-surface">
                    <span>Post-Harvest Transit &amp; Spoilage</span>
                    <span className="font-bold">10% (₦81.4M)</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden">
                    <div className="bg-outline h-full rounded-full" style={{ width: "10%" }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-space-md text-[11px] text-on-surface-variant flex items-center gap-1 font-label-sm">
              <Icon name="verified" className="text-[14px] text-secondary" />
              <span>Reinsured via Africa Re &amp; Continental Re pools</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-space-sm">
                <div className="font-headline-sm text-headline-sm text-on-surface font-bold">Ecological Exposure Corridors</div>
                <Icon name="layers" className="text-primary text-[20px]" />
              </div>
              <p className="text-body-sm text-on-surface-variant mb-space-md">Geographic exposure breakdown &amp; real-time ecological vulnerability index.</p>
              <div className="p-space-sm bg-surface-container-low rounded-lg mb-space-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-on-surface font-semibold">Oyo Derived Savanna</span>
                  <span className="text-error font-label-sm font-bold">Medium Drought Risk</span>
                </div>
                <div className="text-[12px] text-on-surface-variant mt-0.5">Saki, Iseyin, Ogbomoso · <strong>₦448.20M TSI</strong> (55.0% of portfolio)</div>
                <div className="text-[11px] text-on-surface-variant mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-error" />
                  <span>Early dry-spell alert active in Saki West</span>
                </div>
              </div>
              <div className="p-space-sm bg-surface-container-low rounded-lg mb-space-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-on-surface font-semibold">Ogun Basin &amp; Forest Corridor</span>
                  <span className="text-tertiary-container font-label-sm font-bold">Flood Inundation Watch</span>
                </div>
                <div className="text-[12px] text-on-surface-variant mt-0.5">Abeokuta, Sagamu, Obafemi Owode · <strong>₦228.00M TSI</strong></div>
                <div className="text-[11px] text-on-surface-variant mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container" />
                  <span>Dam discharge telemetry monitored</span>
                </div>
              </div>
              <div className="p-space-sm bg-surface-container-low rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-on-surface font-semibold">Osun Mixed Agro Corridor</span>
                  <span className="text-secondary font-label-sm font-bold">Low Historical Variance</span>
                </div>
                <div className="text-[12px] text-on-surface-variant mt-0.5">Ede, Ilesa, Ejigbo · <strong>₦138.00M TSI</strong></div>
                <div className="text-[11px] text-on-surface-variant mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  <span>All micro-indices within historical normal</span>
                </div>
              </div>
            </div>
            <div className="pt-space-md text-[11px] text-on-surface-variant flex items-center gap-1 font-label-sm">
              <Icon name="update" className="text-[14px] text-secondary" />
              <span>NiMet 10-day agro-meteorological forecast active</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-space-sm">
                <div className="font-headline-sm text-headline-sm text-on-surface font-bold">Fast-Track Claims Ledger</div>
                <Icon name="receipt" className="text-secondary text-[20px]" />
              </div>
              <p className="text-body-sm text-on-surface-variant mb-space-md">Recent automated payouts disbursed directly to cooperative reserve wallets.</p>
              <div className="p-space-sm bg-surface-container-low rounded-lg mb-space-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-on-surface font-bold">₦3,120,000.00</span>
                  <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold">PAID (2.1 DAYS)</span>
                </div>
                <div className="text-[12px] text-on-surface-variant mt-1">#POL-2026-088 · Ibarapa Cassava Producers</div>
                <div className="text-[11px] text-on-surface-variant">Trigger: Excess Soil Saturation &gt; 92% · NIBSS Ref: 00921820</div>
              </div>
              <div className="p-space-sm bg-surface-container-low rounded-lg mb-space-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-on-surface font-bold">₦1,850,000.00</span>
                  <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold">PAID (3.4 DAYS)</span>
                </div>
                <div className="text-[12px] text-on-surface-variant mt-1">#POL-2026-092 · Ogbomoso Cashew Syndicate</div>
                <div className="text-[11px] text-on-surface-variant">Trigger: Unseasonal Hailstorm Index · NIBSS Ref: 00918442</div>
              </div>
              <div className="p-space-sm bg-surface-container-low rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-on-surface font-bold">₦1,430,000.00</span>
                  <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold">PAID (4.8 DAYS)</span>
                </div>
                <div className="text-[12px] text-on-surface-variant mt-1">#POL-2026-097 · Ejigbo Grain Collective</div>
                <div className="text-[11px] text-on-surface-variant">Trigger: Micro-Drought Tranche B · NIBSS Ref: 00914401</div>
              </div>
            </div>
            <div className="pt-space-md text-[11px] text-on-surface-variant flex items-center justify-between font-label-sm">
              <span>Average settlement speed: 3.4 days</span>
              <button className="text-primary font-bold hover:underline" type="button">View 38 Settled →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
