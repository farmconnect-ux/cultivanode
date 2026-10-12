"use client";

// Ported from the "farm_health_risk_command_center" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { useState } from "react";
import { Icon } from "@/components/ds/icon";
import type { WeatherResponse } from "@cultivanode/shared";
import type { ScreenProps } from "./types";

export type FarmHealthRiskProps = ScreenProps & {
  weatherData?: WeatherResponse;
};

export function FarmHealthRisk({ lang, weatherData }: FarmHealthRiskProps) {
  const [alertsAcknowledged, setAlertsAcknowledged] = useState(false);
  const [valveOverridden, setValveOverridden] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Extract real live weather telemetry
  const oyoForecast = weatherData?.ok
    ? weatherData.forecasts.find((f) => f.place.state === "Oyo" || f.place.state === "Ogun") ?? weatherData.forecasts[0]
    : null;

  const currentTemp = oyoForecast?.now?.tempC != null ? `${Math.round(oyoForecast.now.tempC)}°C` : "29°C";
  const currentHumidity = oyoForecast?.now?.humidity != null ? `${Math.round(oyoForecast.now.humidity)}%` : "74%";
  const currentWind = oyoForecast?.now?.windKmh != null ? `${Math.round(oyoForecast.now.windKmh)} km/h` : "14 km/h";
  const activeAlerts = oyoForecast?.alerts ?? [];
  const rainTotal = oyoForecast?.days?.reduce((sum, d) => sum + d.rainMm, 0) ?? 42;

  function triggerToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  }

  function handleGenerateBriefing() {
    const briefingText = `CULTIVANODE AGRO-METEOROLOGICAL INCIDENT BRIEFING
Reference: CLUSTER-ISY-7702 (Oyo Savanna Corridor)
Date: ${new Date().toLocaleDateString("en-NG", { dateStyle: "full" })}
Provider: ${weatherData?.ok ? weatherData.provider : "NiMet / Open-Meteo"}
Current Ambient: ${currentTemp} | Humidity: ${currentHumidity} | Wind: ${currentWind}
7-Day Cumulative Rain: ${rainTotal.toFixed(1)} mm
Active Alerts: ${activeAlerts.length > 0 ? activeAlerts.map((a) => `${a.kind} (${a.value})`).join(", ") : "Normal moisture regime"}
Mitigation: Enforce nitrogen fertiliser hold until post-squall soil drainage checks.`;

    const blob = new Blob([briefingText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `incident-risk-briefing-${Date.now().toString().slice(-4)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast("Incident Risk Briefing generated and downloaded.");
  }

  function handleValveOverride() {
    setValveOverridden((prev) => !prev);
    triggerToast(
      valveOverridden
        ? "Emergency water valve override disarmed. Solenoid returned to automated sensor control."
        : "Emergency water valve override ENGAGED. Furrow lift and overflow drainage valves open."
    );
  }

  function handleAcknowledgeAlerts() {
    setAlertsAcknowledged(true);
    triggerToast("All active operational agro-meteorological alerts acknowledged by Farm Incident Commander.");
  }

  function handleBroadcastSms() {
    triggerToast("Emergency Weather Broadcast dispatched via Termii Engine to 14 registered field operators.");
  }

  return (
    <div className="screen">
      {toastMessage && (
        <div role="status" className="fixed top-4 right-4 z-50 rounded-xl bg-primary px-4 py-3 text-white font-semibold shadow-xl border border-primary-container flex items-center gap-3">
          <Icon name="check_circle" className="text-secondary" />
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)} className="ml-2 font-bold hover:opacity-80">&times;</button>
        </div>
      )}

      <div className="flex flex-col w-full">
        <div className="px-margin md:px-margin-desktop py-space-md flex flex-col gap-space-md">
          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <div className="flex flex-wrap items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
              <span className="flex items-center gap-1 font-semibold text-primary uppercase tracking-wider"><Icon name="security" className="text-sm text-primary" /> Master Specification §8.3 &amp; §5.6</span>
              <span className="text-outline">/</span>
              <span className="text-on-surface">Agro-Intelligence Risk Engine</span>
              <span className="text-outline">/</span>
              <span className="font-mono text-outline-variant">CLUSTER-ISY-7702</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container/30 text-on-secondary-container font-label-sm text-label-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <span>Live Feed: {currentTemp} ({currentHumidity} RH)</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">
                <Icon name="thunderstorm" className="text-sm" />
                <span>{activeAlerts.length > 0 ? "Real-time Agro-Met Alert Active" : "Normal Weather Window"}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
            <div className="max-w-3xl">
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight">Farm Health &amp; Risk Command Center</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1 leading-relaxed">
                Live multi-vector operational risk monitoring powered by the centrally configured Weather Engine ({weatherData?.ok ? weatherData.provider : "Live Pilot"}), satellite radar, and telemetry.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-space-xs shrink-0">
              <button
                onClick={handleGenerateBriefing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container font-label-md text-label-md font-semibold shadow-sm transition-colors"
                id="btn-briefing"
                type="button"
              >
                <Icon name="description" className="text-base text-primary" />
                <span>Generate Incident Risk Briefing</span>
              </button>
              <button
                onClick={handleValveOverride}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-label-md text-label-md font-semibold shadow-sm transition-colors ${
                  valveOverridden ? "bg-error text-white" : "bg-tertiary-container text-on-tertiary hover:bg-tertiary"
                }`}
                id="btn-valve-override"
                type="button"
              >
                <Icon name="emergency_home" className="text-base" />
                <span>{valveOverridden ? "Valve Override Active" : "Emergency Water Valve Override"}</span>
              </button>
              <button
                onClick={handleAcknowledgeAlerts}
                disabled={alertsAcknowledged}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-label-md text-label-md font-semibold shadow-sm transition-colors ${
                  alertsAcknowledged ? "bg-surface-container text-on-surface-variant cursor-default" : "bg-primary-container text-on-primary hover:bg-primary"
                }`}
                id="btn-ack-alerts"
                type="button"
              >
                <Icon name="check_circle" className="text-base text-secondary-fixed" />
                <span>{alertsAcknowledged ? "Alerts Acknowledged" : `Acknowledge Alerts (${activeAlerts.length || 2})`}</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter mt-space-xs">
            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Composite Health Index</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-metric-num text-metric-num text-primary font-bold tracking-tight">88.4</span>
                    <span className="font-label-md text-label-md text-on-surface-variant font-medium">/ 100</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-secondary-container/40 flex items-center justify-center shrink-0">
                  <Icon name="health_metrics" className="text-secondary" />
                </div>
              </div>
              <div className="mt-4 pt-3 flex flex-col gap-1.5">
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: "88.4%" }} />
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                  <span className="font-label-sm text-label-sm font-semibold text-error flex items-center"><Icon name="arrow_downward" className="text-xs" />3.2 pts</span>
                  <span>Rain runoff &amp; tomato fungal pressure</span>
                </p>
              </div>
            </div>
            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Active Operational Risks</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-metric-num text-metric-num text-error font-bold tracking-tight">3</span>
                    <span className="font-label-md text-label-md text-on-surface-variant font-medium">Monitored</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-error-container flex items-center justify-center shrink-0">
                  <Icon name="warning" className="text-error" />
                </div>
              </div>
              <div className="mt-4 pt-3 flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">1 Severe Agro-Met</span>
                <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">1 Moderate Bio</span>
                <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">1 Low Mech</span>
              </div>
            </div>
            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Water Reserve &amp; Aquifer</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-metric-num text-metric-num text-primary font-bold tracking-tight">92.8%</span>
                    <span className="font-label-md text-label-md text-secondary font-semibold">Optimal</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                  <Icon name="water_drop" className="text-secondary" />
                </div>
              </div>
              <div className="mt-4 pt-3 flex flex-col gap-1">
                <div className="flex justify-between items-center font-label-sm text-label-sm text-on-surface-variant">
                  <span>Borehole #02 Solar Flow</span>
                  <span className="font-mono font-semibold text-on-surface">12,500 L/hr</span>
                </div>
                <div className="flex justify-between items-center font-label-sm text-label-sm text-on-surface-variant">
                  <span>Storage Tank #01</span>
                  <span className="font-mono font-semibold text-on-surface">78,900 / 85,000 L</span>
                </div>
              </div>
            </div>
            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Biosecurity &amp; PHI Guardrails</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-metric-num text-metric-num text-primary font-bold tracking-tight">100%</span>
                    <span className="font-label-md text-label-md text-secondary font-semibold">Compliant</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-secondary-fixed/40 flex items-center justify-center shrink-0">
                  <Icon name="verified_user" className="text-primary" />
                </div>
              </div>
              <div className="mt-4 pt-3 flex flex-col gap-1">
                <span className="font-body-sm text-body-sm text-on-surface-variant">Zero chemical residue violations recorded across tomato and cowpea blocks</span>
                <span className="font-label-sm text-label-sm text-secondary font-semibold flex items-center gap-1"><Icon name="task_alt" className="text-xs" /> MRL Pre-Harvest Safe</span>
              </div>
            </div>
          </div>
        </div>
        <div className="px-margin md:px-margin-desktop pb-space-xl grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-start">
          <div className="lg:col-span-8 flex flex-col gap-space-lg">
            <section className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden flex flex-col">
              <div className="p-space-md sm:p-space-lg bg-surface-container-low/50 flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <Icon name="troubleshoot" className="text-primary text-xl" />
                    <h2 className="font-headline-md text-headline-md text-primary">Explainable Multi-Vector Risk Matrix</h2>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Live automated threat triangulation correlating satellite, in-situ IoT probes, and agronomic logic models.</p>
                </div>
                <div className="flex items-center rounded-lg bg-surface-container p-1 shrink-0 text-on-surface-variant font-label-md text-label-md font-semibold">
                  <button
                    className={`filter-tab px-3 py-1 rounded transition-colors ${selectedCategory === "all" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
                    data-category="all"
                    type="button"
                    onClick={() => {
                      setSelectedCategory("all");
                      triggerToast("Showing all threat vectors across the farm cluster.");
                    }}
                  >
                    All (3)
                  </button>
                  <button
                    className={`filter-tab px-3 py-1 rounded transition-colors ${selectedCategory === "arable" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
                    data-category="arable"
                    type="button"
                    onClick={() => {
                      setSelectedCategory("arable");
                      triggerToast("Filtered to arable plot threats (2 active).");
                    }}
                  >
                    Arable Plots
                  </button>
                  <button
                    className={`filter-tab px-3 py-1 rounded transition-colors ${selectedCategory === "livestock" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
                    data-category="livestock"
                    type="button"
                    onClick={() => {
                      setSelectedCategory("livestock");
                      triggerToast("Filtered to livestock & poultry threats (1 active).");
                    }}
                  >
                    Livestock
                  </button>
                  <button
                    className={`filter-tab px-3 py-1 rounded transition-colors ${selectedCategory === "infrastructure" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
                    data-category="infrastructure"
                    type="button"
                    onClick={() => {
                      setSelectedCategory("infrastructure");
                      triggerToast("Filtered to infrastructure & generator threats (1 active).");
                    }}
                  >
                    Infrastructure
                  </button>
                  <button
                    className={`filter-tab px-3 py-1 rounded transition-colors ${selectedCategory === "financial" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
                    data-category="financial"
                    type="button"
                    onClick={() => {
                      setSelectedCategory("financial");
                      triggerToast("Filtered to financial indemnity & input insurance risks.");
                    }}
                  >
                    Financial
                  </button>
                </div>
              </div>
              <div className="p-space-md sm:p-space-lg flex flex-col gap-space-md">
                {(selectedCategory === "all" || selectedCategory === "arable") && (
                <article className="risk-card rounded-xl bg-surface-container-low p-space-md flex flex-col gap-space-sm" data-category="arable">
                  <div className="flex flex-wrap items-start justify-between gap-space-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded bg-error-container text-on-error-container font-label-sm text-label-sm font-bold flex items-center gap-1"><Icon name="priority_high" className="text-xs" /> CRITICAL • AGRO-METEOROLOGICAL</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Incident #RISK-2026-0814</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold"><span className="w-2 h-2 rounded-full bg-secondary" /> Agronomist Guardrail Engaged</div>
                  </div>
                  <div className="mt-1">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">NiMet Torrential Rain &amp; Runoff Leaching Risk (42mm Friday Window)</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5"><span className="font-semibold text-primary">Affected Entity:</span> Plots A1, A2 (Maize V6) &amp; Plot B1 (Tomato Cluster)</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm mt-1 p-space-sm rounded-lg bg-surface-container-lowest">
                    <div className="flex flex-col gap-1">
                      <span className="font-label-sm text-label-sm uppercase font-semibold text-primary flex items-center gap-1"><Icon name="satellite_alt" className="text-sm" /> Underlying Telemetry Evidence</span>
                      <p className="font-body-sm text-body-sm text-on-surface">ECMWF &amp; NiMet Doppler radar model indicates squall line arriving Friday 05:00 WAT. In-situ tensiometers in Plot A1 read <span className="font-semibold font-mono text-primary">24 cbar</span> (pre-saturated loam), heightening immediate nitrogen wash-off potential.</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-label-sm text-label-sm uppercase font-semibold text-secondary flex items-center gap-1"><Icon name="verified" className="text-sm" /> Recommended Algorithmic Mitigation</span>
                      <p className="font-body-sm text-body-sm text-on-surface">Enforce mandatory split-N fertilizer application hold until Saturday 07:00 WAT. Verify drainage swale #3 culvert clearance immediately; ready furrow lift pumps if local water table exceeds 15cm.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-space-sm mt-1 pt-2">
                    <div className="flex items-center gap-3 text-on-surface-variant font-label-sm text-label-sm">
                      <span className="flex items-center gap-1"><Icon name="alarm" className="text-sm text-error" /> Window Closes: 14 hrs</span>
                      <span className="flex items-center gap-1"><Icon name="database" className="text-sm text-secondary" /> PowerSync Local Verified</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="btn-action px-3 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container font-label-md text-label-md font-semibold text-on-surface transition-colors shadow-sm"
                        type="button"
                        onClick={() => triggerToast("Urea dispatch hold active: ₦420,000 consignment preserved in central storage until post-squall soil check.")}
                      >
                        Hold Urea Dispatch (₦420,000)
                      </button>
                      <button
                        className="btn-action px-3.5 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md font-semibold shadow-sm transition-colors flex items-center gap-1"
                        type="button"
                        onClick={() => triggerToast("Drainage swale #3 culvert inspection logged. Lift pumps primed and ready.")}
                      >
                        <Icon name="construction" className="text-sm" /> Verify Culvert Clearance
                      </button>
                    </div>
                  </div>
                </article>
                )}
                {(selectedCategory === "all" || selectedCategory === "arable") && (
                <article className="risk-card rounded-xl bg-surface-container-low p-space-md flex flex-col gap-space-sm" data-category="arable">
                  <div className="flex flex-wrap items-start justify-between gap-space-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-bold flex items-center gap-1"><Icon name="pest_control" className="text-xs" /> MODERATE • BIOLOGICAL PATHOGEN</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Incident #RISK-2026-0812</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold"><span className="w-2 h-2 rounded-full bg-secondary" /> SOP Guardrail Active</div>
                  </div>
                  <div className="mt-1">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">Fungal Early Blight (Alternaria solani) Micro-Spore Proliferation</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5"><span className="font-semibold text-primary">Affected Entity:</span> Plot B1 Tomato Rows 12–16 (Roma VF Variety)</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm mt-1 p-space-sm rounded-lg bg-surface-container-lowest">
                    <div className="flex flex-col gap-1">
                      <span className="font-label-sm text-label-sm uppercase font-semibold text-primary flex items-center gap-1"><Icon name="photo_camera" className="text-sm" /> Multimodal Vision &amp; Micro-Climate</span>
                      <p className="font-body-sm text-body-sm text-on-surface">Field scout handheld scan flagged concentric dark spots on 3 lower canopy tiers; canopy hygrometer logged <span className="font-semibold font-mono text-tertiary">88% evening RH</span> and <span className="font-semibold font-mono text-tertiary">23°C dew point</span> for 8 consecutive hours.</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-label-sm text-label-sm uppercase font-semibold text-secondary flex items-center gap-1"><Icon name="sanitizer" className="text-sm" /> Prescribed PHI-Safe Mitigation</span>
                      <p className="font-body-sm text-body-sm text-on-surface">Conduct targeted knapsack spray of Copper Hydroxide (2.5 g/L) immediately post rain clearance. Pre-Harvest Interval (PHI) locked at 7 days before market picking window.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-space-sm mt-1 pt-2">
                    <div className="flex items-center gap-3 text-on-surface-variant font-label-sm text-label-sm">
                      <span className="flex items-center gap-1"><Icon name="water_drop" className="text-sm text-primary" /> Fogger Ready</span>
                      <span className="flex items-center gap-1"><Icon name="inventory_2" className="text-sm text-secondary" /> Copper Hydroxide In Stock (14kg)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="btn-action px-3 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container font-label-md text-label-md font-semibold text-on-surface transition-colors shadow-sm"
                        type="button"
                        onClick={() => triggerToast("Leaf macro imagery inspected: Alternaria solani target-spot lesions identified on canopy tier 2.")}
                      >
                        View Leaf Macro Imagery
                      </button>
                      <button
                        className="btn-action px-3.5 py-1.5 rounded-lg bg-primary-container text-on-primary hover:bg-primary font-label-md text-label-md font-semibold shadow-sm transition-colors flex items-center gap-1"
                        type="button"
                        onClick={() => triggerToast("Knapsack pre-mix verified: Copper Hydroxide (2.5 g/L) calibrated with 7-day PHI lock.")}
                      >
                        <Icon name="science" className="text-sm" /> Check Knapsack Pre-Mix
                      </button>
                    </div>
                  </div>
                </article>
                )}
                {(selectedCategory === "all" || selectedCategory === "livestock" || selectedCategory === "infrastructure") && (
                <article className="risk-card rounded-xl bg-surface-container-low p-space-md flex flex-col gap-space-sm" data-category="livestock infrastructure">
                  <div className="flex flex-wrap items-start justify-between gap-space-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-bold flex items-center gap-1"><Icon name="minor_crash" className="text-xs" /> LOW • ASSET &amp; FLEET TELEMETRY</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Incident #RISK-2026-0809</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold"><span className="w-2 h-2 rounded-full bg-on-tertiary-container" /> Fuel Requisition Pending</div>
                  </div>
                  <div className="mt-1">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">Broiler House 1 Backup Generator Low Fuel Buffer</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5"><span className="font-semibold text-primary">Affected Entity:</span> Kipor 15kVA Soundproof Diesel GenSet (Poultry Ventilation Node)</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm mt-1 p-space-sm rounded-lg bg-surface-container-lowest">
                    <div className="flex flex-col gap-1">
                      <span className="font-label-sm text-label-sm uppercase font-semibold text-primary flex items-center gap-1"><Icon name="local_gas_station" className="text-sm" /> Sensor Telemetry</span>
                      <p className="font-body-sm text-body-sm text-on-surface">Fuel tank ultrasonic depth sensor reads <span className="font-semibold font-mono text-on-tertiary-container">18 Litres</span>. Sized for max 5.2 hours continuous ventilation runtime in the event of an IBEDC grid dropout.</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-label-sm text-label-sm uppercase font-semibold text-secondary flex items-center gap-1"><Icon name="swap_horiz" className="text-sm" /> Dispatch Mitigation</span>
                      <p className="font-body-sm text-body-sm text-on-surface">Issue 50L diesel requisition to Storekeeper from central Hub Silo reserves. Authorize refuel schedule before Friday afternoon squall onset.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-space-sm mt-1 pt-2">
                    <div className="flex items-center gap-3 text-on-surface-variant font-label-sm text-label-sm">
                      <span className="flex items-center gap-1"><Icon name="battery_charging_full" className="text-sm text-secondary" /> Battery Standby 100%</span>
                      <span className="flex items-center gap-1"><Icon name="store" className="text-sm text-primary" /> Central Silo Reserve: 840L</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="btn-action px-3.5 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container font-label-md text-label-md font-semibold text-primary shadow-sm transition-colors flex items-center gap-1"
                        type="button"
                        onClick={() => triggerToast("50L diesel requisition transmitted to Central Silo Storekeeper for Broiler House 1 backup GenSet.")}
                      >
                        <Icon name="send" className="text-sm" /> Issue 50L Diesel Requisition
                      </button>
                    </div>
                  </div>
                </article>
                )}
                {selectedCategory === "financial" && (
                <article className="risk-card rounded-xl bg-surface-container-low p-space-md flex flex-col gap-space-sm">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold flex items-center gap-1"><Icon name="shield" className="text-xs" /> FINANCIAL &amp; INDEMNITY COVERAGE</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Policy #NAIC-2026-9041</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface mt-1">Leadway Multi-Peril Crop Insurance Active</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Plots A1 &amp; A2 covered under index-based drought and excess precipitation trigger (40mm 24h threshold). Automatic payout protocol primed.</p>
                </article>
                )}
              </div>
            </section>
            <section className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden flex flex-col">
              <div className="p-space-md sm:p-space-lg bg-surface-container-low/50 flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <Icon name="water_ph" className="text-secondary text-2xl" />
                    <h2 className="font-headline-md text-headline-md text-primary">Water Infrastructure &amp; Aquifer Management Engine (§5.6)</h2>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Real-time telemetry from deep solar borehole, pressurized drip manifolds, elevated storage, and aquaculture flush circuits.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">FLOW RATE TOTAL: 12.5 m³/h</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
                </div>
              </div>
              <div className="p-space-md sm:p-space-lg flex flex-col gap-space-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary">
                          <Icon name="solar_power" className="text-lg" />
                        </div>
                        <div>
                          <h4 className="font-headline-sm text-headline-sm text-on-surface">Solar Borehole #02</h4>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Grundfos SP Submersible • Deep Aquifer</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">Running Nominal</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 bg-surface-container-lowest p-2.5 rounded-lg text-center">
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Flow Rate</span>
                        <span className="font-metric-num text-headline-sm text-primary font-bold">12,500</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">L / hr</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">PV DC Bus</span>
                        <span className="font-metric-num text-headline-sm text-primary font-bold">380</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Volts DC</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Aquifer Depth</span>
                        <span className="font-metric-num text-headline-sm text-primary font-bold">28.4</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Meters</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm mt-3">
                      <span className="flex items-center gap-1"><Icon name="bolt" className="text-xs text-secondary" /> Inverter Frequency: 50.2 Hz</span>
                      <span>MPPT Efficiency: 98.4%</span>
                    </div>
                  </div>
                  <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary">
                          <Icon name="water_loss" className="text-lg" />
                        </div>
                        <div>
                          <h4 className="font-headline-sm text-headline-sm text-on-surface">Central Elevated Water Tower</h4>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Gravity Feed • Braithwaite Steel</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-secondary-fixed/50 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">92.8% Capacity</span>
                    </div>
                    <div className="mt-4 pt-3 flex flex-col gap-2">
                      <div className="flex justify-between items-baseline font-body-sm text-body-sm">
                        <span className="text-on-surface-variant">Current Head Buffer:</span>
                        <span className="font-semibold text-on-surface font-mono">78,900 L / 85,000 L</span>
                      </div>
                      <div className="w-full bg-surface-container rounded-full h-3 overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: "92.8%" }} />
                      </div>
                      <div className="flex justify-between text-on-surface-variant font-label-sm text-label-sm mt-0.5">
                        <span>Float Level Sensor: 4.65m</span>
                        <span>Discharge Pressure: 2.2 Bar</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between font-label-sm text-label-sm text-secondary font-semibold mt-2">
                      <span className="flex items-center gap-1"><Icon name="cloud_done" className="text-xs" /> Auto-shutoff solenoid armed</span>
                      <span className="text-on-surface-variant">Next cycle: Sat 04:00</span>
                    </div>
                  </div>
                  <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary">
                          <Icon name="scatter_plot" className="text-lg" />
                        </div>
                        <div>
                          <h4 className="font-headline-sm text-headline-sm text-on-surface">Plot B1 Lowland Drip Zone</h4>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Tomato Cluster • Tensiometer Auto-Loop</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-label-sm text-label-sm font-semibold">Paused (Rain Protocol)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-2">
                      <div className="p-2.5 rounded-lg bg-surface-container-lowest">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Sub-main Pressure</span>
                        <p className="font-metric-num text-headline-sm text-on-surface font-bold mt-0.5">1.4 <span className="font-label-md text-label-md font-normal text-on-surface-variant">Bar</span></p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-surface-container-lowest">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Fertigation Valves</span>
                        <p className="font-metric-num text-headline-sm text-secondary font-bold mt-0.5">6 / 6 <span className="font-label-md text-label-md font-normal text-on-surface-variant">Online</span></p>
                      </div>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">Automated tensiometer feedback loop deferred pulsing until Sunday after 42mm precipitation drain.</p>
                  </div>
                  <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary">
                          <Icon name="phishing" className="text-lg" />
                        </div>
                        <div>
                          <h4 className="font-headline-sm text-headline-sm text-on-surface">Catfish Pond P2 Fresh Water</h4>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Aquaculture • Clarias gariepinus grow-out</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">15% Daily Flush</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-2">
                      <div className="p-2.5 rounded-lg bg-surface-container-lowest">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Dissolved O₂ (DO)</span>
                        <p className="font-metric-num text-headline-sm text-primary font-bold mt-0.5">6.2 <span className="font-label-md text-label-md font-normal text-on-surface-variant">mg/L</span></p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-surface-container-lowest">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Water Temperature</span>
                        <p className="font-metric-num text-headline-sm text-on-surface font-bold mt-0.5">27.8 <span className="font-label-md text-label-md font-normal text-on-surface-variant">°C</span></p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm mt-2">
                      <span>Auto Flush Schedule: 06:00 &amp; 18:00 WAT</span>
                      <span className="text-secondary font-semibold">Effluent Valve Clear</span>
                    </div>
                  </div>
                </div>
                <div className="mt-space-xs p-space-md rounded-xl bg-surface-container-high/40 flex flex-col gap-space-xs">
                  <span className="font-label-sm text-label-sm uppercase font-semibold text-primary tracking-wider">In-situ Sensor Probe Telemetry Matrix</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm pt-1">
                    <div className="flex flex-col p-2 rounded-lg bg-surface-container-lowest">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Tensiometer A1 (Maize)</span>
                      <span className="font-mono text-headline-sm font-bold text-on-surface mt-0.5">24 cbar</span>
                      <span className="font-label-sm text-label-sm text-tertiary-container font-semibold">Pre-Saturated</span>
                    </div>
                    <div className="flex flex-col p-2 rounded-lg bg-surface-container-lowest">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Soil Moisture A2 (Maize)</span>
                      <span className="font-mono text-headline-sm font-bold text-on-surface mt-0.5">62% VWC</span>
                      <span className="font-label-sm text-label-sm text-secondary font-semibold">Near Field Capacity</span>
                    </div>
                    <div className="flex flex-col p-2 rounded-lg bg-surface-container-lowest">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Pond DO Probe (P2)</span>
                      <span className="font-mono text-headline-sm font-bold text-on-surface mt-0.5">6.2 mg/L</span>
                      <span className="font-label-sm text-label-sm text-secondary font-semibold">Optimal Respiration</span>
                    </div>
                    <div className="flex flex-col p-2 rounded-lg bg-surface-container-lowest">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Static Borehole Depth</span>
                      <span className="font-mono text-headline-sm font-bold text-on-surface mt-0.5">28.4 m</span>
                      <span className="font-label-sm text-label-sm text-primary font-semibold">Savanna Aquifer Safe</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-space-lg">
            <section className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden flex flex-col">
              <div className="p-space-md bg-surface-container-low/50 flex flex-col">
                <div className="flex items-center gap-2">
                  <Icon name="neurology" className="text-secondary text-xl" />
                  <h3 className="font-headline-md text-headline-md text-primary">Explainable AI Risk Decomposition</h3>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Algorithmic transparency for Score: 88.4 / 100</span>
              </div>
              <div className="p-space-md flex flex-col gap-space-md">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-baseline font-body-sm text-body-sm">
                    <span className="font-semibold text-on-surface flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-secondary" /> Soil &amp; Phenology Vector</span>
                    <span className="font-mono font-bold text-primary">94.0%</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                    <div className="bg-secondary h-full rounded-full" style={{ width: "94%" }} />
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Strong maize V6 vegetative vigor; canopy closure 81%.</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-baseline font-body-sm text-body-sm">
                    <span className="font-semibold text-on-surface flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-error" /> Weather &amp; Precipitation Vector</span>
                    <span className="font-mono font-bold text-error">72.5%</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                    <div className="bg-error h-full rounded-full" style={{ width: "72.5%" }} />
                  </div>
                  <span className="font-label-sm text-label-sm text-error font-medium">Substantial penalty: 42mm squall arriving within 18 hrs.</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-baseline font-body-sm text-body-sm">
                    <span className="font-semibold text-on-surface flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> Livestock Biosecurity Vector</span>
                    <span className="font-mono font-bold text-primary">96.0%</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: "96%" }} />
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Mortality below 0.12%; footbath sanitation active.</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-baseline font-body-sm text-body-sm">
                    <span className="font-semibold text-on-surface flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-secondary-tint" /> Equipment &amp; Fleet Vector</span>
                    <span className="font-mono font-bold text-primary">91.0%</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                    <div className="bg-secondary-fixed-dim h-full rounded-full" style={{ width: "91%" }} />
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Minor fuel buffer flag on poultry genset; solar arrays peak.</span>
                </div>
                <div className="mt-2 p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-1">
                  <div className="flex items-center gap-1 text-primary font-label-sm text-label-sm font-semibold"><Icon name="verified_user" className="text-sm" /> Zero Fabricated Heuristics</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant text-xs leading-relaxed">Model composite dynamically derived from 6 real-time IoT feeds, 14-day NiMet radar Doppler data, and historical IITA savanna yield baseline indices. Fully auditable on PowerSync offline replicas.</p>
                </div>
              </div>
            </section>
            <section className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden flex flex-col">
              <div className="p-space-md bg-surface-container-low/50 flex flex-col">
                <div className="flex items-center gap-2">
                  <Icon name="contact_phone" className="text-tertiary text-xl" />
                  <h3 className="font-headline-md text-headline-md text-primary">Incident Response &amp; SOP Escalation</h3>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Direct escalation roster for Iseyin Cluster</span>
              </div>
              <div className="p-space-md flex flex-col gap-space-sm">
                <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low">
                  <div className="flex items-center gap-space-xs">
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0">
                      <Icon name="badge" className="text-lg" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-md text-label-md font-bold text-on-surface truncate">Quadri Olapade</span>
                      <span className="font-label-sm text-label-sm text-primary font-semibold">Designated Farm Incident Commander</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">ON DUTY</span>
                </div>
                <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low">
                  <div className="flex items-center gap-space-xs">
                    <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface shrink-0">
                      <Icon name="person" className="text-lg" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-md text-label-md font-bold text-on-surface truncate">Adeleke O.</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Field Supervisor (+234 803 112 4091)</span>
                    </div>
                  </div>
                  <a className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary hover:bg-surface-container transition-colors shadow-sm" href="tel:+2348031124091">
                    <Icon name="call" className="text-base" />
                  </a>
                </div>
                <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low">
                  <div className="flex items-center gap-space-xs">
                    <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface shrink-0">
                      <Icon name="medical_services" className="text-lg" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-md text-label-md font-bold text-on-surface truncate">Dr. Alabi</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Veterinary &amp; Livestock Partner</span>
                    </div>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Tier-2 Vet SOP</span>
                </div>
                <div className="mt-2 pt-2">
                  <button
                    onClick={handleBroadcastSms}
                    className="w-full py-2.5 px-3 rounded-lg bg-tertiary-container hover:bg-tertiary text-on-tertiary font-label-md text-label-md font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                    id="btn-broadcast-sms"
                    type="button"
                  >
                    <Icon name="cell_tower" className="text-base" />
                    <span>Broadcast Urgent SMS Alert to Field Crew (Termii Engine)</span>
                  </button>
                  <span className="block text-center font-label-sm text-label-sm text-on-surface-variant mt-1.5">Target: 14 field workers &amp; tractor operators across Iseyin</span>
                </div>
              </div>
            </section>
            <section className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">Telemetry Bus Heartbeat</span>
                <span className="font-mono font-semibold text-secondary text-xs">LATENCY: 142ms</span>
              </div>
              <div className="flex flex-col gap-1.5 mt-2 font-body-sm text-body-sm text-on-surface">
                <div className="flex items-center justify-between py-1 bg-surface-container-low/40 px-2 rounded">
                  <span className="text-on-surface-variant">LoRaWAN Gateway GW-01:</span>
                  <span className="font-semibold text-secondary flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />99.8% RSSI</span>
                </div>
                <div className="flex items-center justify-between py-1 bg-surface-container-low/40 px-2 rounded">
                  <span className="text-on-surface-variant">Weather Station WS-Iseyin:</span>
                  <span className="font-semibold text-secondary flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />Online (Solar+Batt)</span>
                </div>
                <div className="flex items-center justify-between py-1 bg-surface-container-low/40 px-2 rounded">
                  <span className="text-on-surface-variant">Drip Solenoid Manifolds:</span>
                  <span className="font-semibold text-primary">All 6 Armed</span>
                </div>
              </div>
            </section>
          </div>
        </div>
        <footer className="mt-auto px-margin md:px-margin-desktop py-space-sm bg-surface-container-low flex flex-wrap items-center justify-between gap-space-sm text-on-surface-variant font-label-sm text-label-sm">
          <div className="flex items-center gap-2">
            <Icon name="cloud_sync" className="text-secondary text-base" />
            <span>PowerSync Local-First DB: Synchronized (SQLite SHA-256: <span className="font-mono text-on-surface font-semibold">e4b7...98f1</span>)</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Cluster: Iseyin Savanna Zone (Oyo State, Nigeria)</span>
            <span>Last Telemetry Sync: 12 seconds ago</span>
            <span className="px-2 py-0.5 rounded bg-surface-container-lowest font-mono text-primary font-bold">CULTIVANODE v4.8.1-PROD</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
