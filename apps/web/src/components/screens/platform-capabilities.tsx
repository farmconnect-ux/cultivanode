"use client";

// Ported from the "platform_architecture_capabilities_cultivanode" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";
import { showScreenToast } from "@/components/screens/screen-toast";
import { phrasebook } from "@/i18n/marketing";
import YO from "@/i18n/yo-marketing/platform-capabilities";

const tYo = phrasebook(YO);

export function PlatformCapabilities({ lang = "en" }: ScreenProps) {
  const [activeRole, setActiveRole] = useState<"smallholder" | "commercial" | "machinery" | "aggregators">("smallholder");
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <section className="relative w-full overflow-hidden bg-surface-container-low py-space-xl lg:py-24">
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 600">
              <defs>
                <radialGradient cx="30%" cy="20%" id="meshGrad" r="60%">
                  <stop offset="0%" stopColor="#b4f0cb" stopOpacity="0.35" />
                  <stop offset="50%" stopColor="#eff4ff" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#f8f9ff" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect fill="url(#meshGrad)" height="600" width="1200" />
              <path d="M0,180 Q300,120 600,220 T1200,160" fill="none" stroke="#99d3b0" strokeDasharray="6 8" strokeWidth="1.5" />
              <path d="M0,320 Q450,260 900,380 T1200,290" fill="none" stroke="#6ffbbe" strokeDasharray="4 6" strokeWidth="1.2" />
            </svg>
          </div>
          <div className="relative max-w-7xl mx-auto px-margin md:px-margin-desktop">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">
              <div className="lg:col-span-7 flex flex-col gap-space-md">
                <div className="inline-flex items-center gap-space-xs self-start bg-surface-container-lowest px-space-sm py-1 rounded-full shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider">{tYo("CONNECTED AGRARIAN INTELLIGENCE PLATFORM · /en/platform")}</span>
                </div>
                <h1 className="font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg text-primary tracking-tight">{tYo("The Operating System for Modern African Agriculture")}</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">{tYo("CultivaNode synchronizes precision farm GIS delineation, phenological crop planning, mechanized syndicate hiring, and verifiable financial records into one unified, offline-resilient architecture engineered for South-West Nigeria.")}</p>
                <div className="flex flex-wrap items-center gap-space-sm pt-space-xs">
                  <a className="inline-flex items-center gap-space-xs font-label-lg text-label-lg bg-primary text-on-primary px-space-md py-3 rounded-lg shadow-sm hover:bg-primary-container transition-colors" href="#architecture-tiers"><Icon name="account_tree" className="text-[20px]" />{tYo(" Explore Architecture")}</a>
                  <Link className="inline-flex items-center gap-space-xs font-label-lg text-label-lg bg-surface-container-lowest text-primary px-space-md py-3 rounded-lg shadow-sm hover:bg-surface-container transition-colors" href={`/${lang}/sign-up`}><Icon name="how_to_reg" className="text-[20px]" />{tYo(" Create Free Account")}</Link>
                  <a className="inline-flex items-center gap-space-xs font-label-lg text-label-lg text-secondary px-space-md py-3 rounded-lg hover:bg-surface-container transition-colors" href="#pilot-clusters"><Icon name="explore" className="text-[20px]" />{tYo(" Review Pilot Clusters")}</a>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-xs pt-space-md">
                  <div className="flex flex-col p-space-sm bg-surface-container-lowest rounded-lg shadow-sm">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{tYo("Agronomic Scope")}</span>
                    <span className="font-headline-sm text-headline-sm text-primary">{tYo("15 SW Crops")}</span>
                  </div>
                  <div className="flex flex-col p-space-sm bg-surface-container-lowest rounded-lg shadow-sm">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{tYo("Pilot Synergies")}</span>
                    <span className="font-headline-sm text-headline-sm text-secondary">{tYo("0% Escrow Fee")}</span>
                  </div>
                  <div className="flex flex-col p-space-sm bg-surface-container-lowest rounded-lg shadow-sm">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{tYo("GIS Cadastral")}</span>
                    <span className="font-headline-sm text-headline-sm text-primary">{tYo("Sub-Meter RTK")}</span>
                  </div>
                  <div className="flex flex-col p-space-sm bg-surface-container-lowest rounded-lg shadow-sm">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{tYo("Regulatory")}</span>
                    <span className="font-headline-sm text-headline-sm text-secondary">{tYo("NDPA 2023 Valid")}</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-5 flex flex-col gap-space-md">
                <div className="relative bg-surface-container-lowest rounded-xl shadow-md p-space-md flex flex-col gap-space-md">
                  <div className="flex items-center justify-between pb-space-xs bg-surface-container-low px-space-sm py-2 rounded-lg">
                    <div className="flex items-center gap-space-xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                      <span className="font-label-sm text-label-sm text-primary font-semibold">{tYo("MESH NODE #OYO-IBD-082")}</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Live Cadastral Stream")}</span>
                  </div>
                  <div className="relative w-full h-56 rounded-lg overflow-hidden bg-surface-container flex items-center justify-center">
                    <img className="w-full h-full object-cover" data-alt="High-resolution aerial satellite composite of lush terraced agricultural plots in Oyo State Nigeria with vibrant green cassava and maize canopies overlaid with neon geometric boundary polygons and soil moisture sensor nodes under clear equatorial daylight" src="/images/screens/053c375d14c5.webp" alt="" loading="lazy" decoding="async" />
                    <div className="absolute bottom-3 left-3 bg-primary/90 text-on-primary px-space-sm py-1 rounded-lg backdrop-blur shadow-sm flex items-center gap-space-xs">
                      <Icon name="layers" className="text-[16px] text-secondary-fixed" />
                      <span className="font-label-sm text-label-sm">{tYo("48.6 Ha · Ido Agrarian Cluster")}</span>
                    </div>
                    <div className="absolute top-3 right-3 bg-surface-container-lowest/90 px-space-sm py-1 rounded-lg shadow-sm flex items-center gap-1">
                      <Icon name="satellite_alt" className="text-[14px] text-secondary" />
                      <span className="font-label-sm text-label-sm text-primary font-bold">{tYo("Sentinel-2 Sync: OK")}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-space-xs">
                    <div className="bg-surface-container-low p-space-xs rounded-lg flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Soil Type")}</span>
                      <span className="font-label-lg text-label-lg text-primary font-semibold">{tYo("Luvisols (pH 6.2)")}</span>
                    </div>
                    <div className="bg-surface-container-low p-space-xs rounded-lg flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Stage")}</span>
                      <span className="font-label-lg text-label-lg text-primary font-semibold">{tYo("V4 Vegetative")}</span>
                    </div>
                    <div className="bg-surface-container-low p-space-xs rounded-lg flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Escrow State")}</span>
                      <span className="font-label-lg text-label-lg text-secondary font-semibold">{tYo("₦3.8M Locked")}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm px-1">
                    <span className="flex items-center gap-1"><Icon name="sync" className="text-[16px] text-secondary" />{tYo(" Offline DB sync queue: 0 pending")}</span>
                    <span className="text-secondary font-medium">{tYo("99.98% Telemetry Uptime")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-space-xl bg-surface" id="architecture-tiers">
          <div className="max-w-7xl mx-auto px-margin md:px-margin-desktop flex flex-col gap-space-lg">
            <div className="flex flex-col gap-space-xs max-w-3xl">
              <div className="inline-flex items-center gap-space-xs text-secondary font-label-md text-label-md uppercase tracking-wider"><Icon name="hub" className="text-[18px]" />{tYo(" Full-Stack Agrarian Engineering")}</div>
              <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary">{tYo("Four Synchronized Architectural Layers")}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">{tYo("CultivaNode decouples complex regional agricultural friction into four deterministic computational layers, ensuring low-bandwidth field phones stay synchronized with institutional commercial escrow.")}</p>
            </div>
            <div className="grid grid-cols-1 gap-space-md">
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-space-md hover:shadow-md transition-shadow">
                <div className="flex items-start gap-space-md lg:w-1/3">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 text-primary">
                    <Icon name="terrain" className="text-[28px]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider">{tYo("Tier 1 · Field Baseline")}</span>
                    <h3 className="font-headline-md text-headline-md text-primary">{tYo("Physical Cadastral Layer")}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant pt-1">{tYo("Mapping exact geospatial ground truth, soil pedology profiles, and customary land tenancy.")}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm lg:w-2/3">
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="polyline" className="text-[16px] text-secondary" />{tYo(" PostGIS Polygons")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Sub-meter boundary walks & RTK field verification")}</span>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="science" className="text-[16px] text-secondary" />{tYo(" Luvisol Pedology")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Profile mapping for basement complex soils")}</span>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="badge" className="text-[16px] text-secondary" />{tYo(" Baale Attestation")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Digitized customary land rights & witness logs")}</span>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="air" className="text-[16px] text-secondary" />{tYo(" NiMet Climate Mesh")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Dual-source rainfall & micro-catchment telemetry")}</span>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-space-md hover:shadow-md transition-shadow">
                <div className="flex items-start gap-space-md lg:w-1/3">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 text-primary">
                    <Icon name="agriculture" className="text-[28px]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider">{tYo("Tier 2 · Syndicate Orchestration")}</span>
                    <h3 className="font-headline-md text-headline-md text-primary">{tYo("Operational & Machinery")}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant pt-1">{tYo("Automated seasonal calendars, equipment syndicate routing, and offline-first data sync.")}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm lg:w-2/3">
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="event_repeat" className="text-[16px] text-secondary" />{tYo(" Phenology Planner")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Growth-stage triggers for 15 agro-ecological crops")}</span>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="precision_manufacturing" className="text-[16px] text-secondary" />{tYo(" Tractor Dispatch")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Demand clustering for low-loader machinery haulage")}</span>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="qr_code_2" className="text-[16px] text-secondary" />{tYo(" Certified Vouchers")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Anti-counterfeit seed and chemical redemption tags")}</span>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="wifi_off" className="text-[16px] text-secondary" />{tYo(" Offline SQLite Sync")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Seamless reconciliation upon 2G/3G connectivity")}</span>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-space-md hover:shadow-md transition-shadow">
                <div className="flex items-start gap-space-md lg:w-1/3">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 text-primary">
                    <Icon name="account_balance" className="text-[28px]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider">{tYo("Tier 3 · Financial Settlement")}</span>
                    <h3 className="font-headline-md text-headline-md text-primary">{tYo("Commercial & Escrow Rails")}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant pt-1">{tYo("CBN-compliant escrow custody, immutable farm ledgers, and weighbridge integrations.")}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm lg:w-2/3">
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="receipt_long" className="text-[16px] text-secondary" />{tYo(" Hash-Chained Books")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Cryptographically verifiable double-entry bookkeeping")}</span>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="lock" className="text-[16px] text-secondary" />{tYo(" Providus/Wema Escrow")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Guaranteed payout released only upon GPS hectare signoff")}</span>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="scale" className="text-[16px] text-secondary" />{tYo(" Digital Weighbridge")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Hardware-integrated gross and tare scale calibration")}</span>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="history_toggle_off" className="text-[16px] text-secondary" />{tYo(" 48h Resolution Desk")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Agronomist-moderated syndicate arbitration protocols")}</span>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-space-md hover:shadow-md transition-shadow">
                <div className="flex items-start gap-space-md lg:w-1/3">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 text-primary">
                    <Icon name="psychology" className="text-[28px]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider">{tYo("Tier 4 · Institutional Intelligence")}</span>
                    <h3 className="font-headline-md text-headline-md text-primary">{tYo("Intelligence & Governance")}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant pt-1">{tYo("Multilingual AI agronomists, ADP extension officer dashboards, and bank-grade credit profiling.")}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm lg:w-2/3">
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="smart_toy" className="text-[16px] text-secondary" />{tYo(" Multilingual AI")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Diagnostics delivered via voice in Yoruba, Pidgin, English")}</span>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="supervisor_account" className="text-[16px] text-secondary" />{tYo(" ADP Oversight")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("State Agricultural Development Programme audit portals")}</span>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="credit_score" className="text-[16px] text-secondary" />{tYo(" Credit Scoring")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Production-backed risk indices for commercial lenders")}</span>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="policy" className="text-[16px] text-secondary" />{tYo(" NDPA Compliance")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Revocable data rights with cryptographically signed consent")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-space-xl bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-margin md:px-margin-desktop flex flex-col gap-space-lg">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
              <div>
                <span className="font-label-md text-label-md text-secondary uppercase tracking-wider font-semibold">{tYo("Production Capabilities")}</span>
                <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary mt-1">{tYo("Modular Agrarian Engine")}</h2>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">{tYo("Every capability is built specifically for low-overhead field operations, featuring high visual contrast and zero unnecessary friction.")}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                      <Icon name="map" className="text-[24px]" />
                    </div>
                    <span className="bg-surface-container-low text-secondary font-label-sm text-label-sm px-2 py-0.5 rounded-full font-semibold">{tYo("PostGIS 3.4")}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary">{tYo("Farm & Field Cadastral")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Sub-meter polygon boundary walking with built-in tolerance for canopy drift. Encapsulates customary Baale title attestations, communal boundary disputes, and soil pedology surveys into an exportable deed dossier.")}</p>
                </div>
                <div className="pt-space-md mt-space-md bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Customary Deeds")}</span>
                  <span className="font-label-lg text-label-lg text-primary font-bold">{tYo("100% Baale Validated")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                      <Icon name="calendar_month" className="text-[24px]" />
                    </div>
                    <span className="bg-surface-container-low text-secondary font-label-sm text-label-sm px-2 py-0.5 rounded-full font-semibold">{tYo("15 SW Cultivars")}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary">{tYo("Phenology & Input Planner")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Dynamic growth-stage scheduling calibrated for regional cultivars including SAMMAZ-15 maize and TME-419 cassava. Prescribes split NPK nitrogen dressing and optimal spray windows synchronized with local rain forecasts.")}</p>
                </div>
                <div className="pt-space-md mt-space-md bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Recommended Yield Delta")}</span>
                  <span className="font-label-lg text-label-lg text-secondary font-bold">{tYo("+28% Avg. Lift")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                      <Icon name="local_shipping" className="text-[24px]" />
                    </div>
                    <span className="bg-surface-container-low text-secondary font-label-sm text-label-sm px-2 py-0.5 rounded-full font-semibold">{tYo("Zero Broker Fee")}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary">{tYo("Machinery Syndication")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Tractor and heavy implement mobilization without payment anxiety. Funds lock safely in escrow upon booking and disburse automatically once tractor telematics verify completed hectare coverage without active dispute.")}</p>
                </div>
                <div className="pt-space-md mt-space-md bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Dispute Turnaround")}</span>
                  <span className="font-label-lg text-label-lg text-primary font-bold">{tYo("< 48 Hours SLA")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                      <Icon name="menu_book" className="text-[24px]" />
                    </div>
                    <span className="bg-surface-container-low text-secondary font-label-sm text-label-sm px-2 py-0.5 rounded-full font-semibold">{tYo("SHA-256 Audit")}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary">{tYo("Inventory & Farm Ledger")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("True double-entry managerial accounting purpose-built for farm managers. Instantly reveals real cost-per-hectare, chemical batch consumption, labor disbursements, and expected crop harvest margins with PDF audit exports.")}</p>
                </div>
                <div className="pt-space-md mt-space-md bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Bank Grade Export")}</span>
                  <span className="font-label-lg text-label-lg text-primary font-bold">{tYo("IFRS Compliant")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                      <Icon name="cyclone" className="text-[24px]" />
                    </div>
                    <span className="bg-surface-container-low text-secondary font-label-sm text-label-sm px-2 py-0.5 rounded-full font-semibold">{tYo("Dual Mesh")}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary">{tYo("Weather & Climate Grid")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("14-day high-resolution meteorological models merging NiMet alerts with Open-Meteo micro-telemetry. Automatically flags early cessation of bimodal rains, mid-season dry spells, and high evaporation heatwaves.")}</p>
                </div>
                <div className="pt-space-md mt-space-md bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Prediction Resolution")}</span>
                  <span className="font-label-lg text-label-lg text-secondary font-bold">{tYo("1.2 km Precision")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                      <Icon name="psychology_alt" className="text-[24px]" />
                    </div>
                    <span className="bg-surface-container-low text-secondary font-label-sm text-label-sm px-2 py-0.5 rounded-full font-semibold">{tYo("Multimodal AI")}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary">{tYo("AI Diagnostic Assistant")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Photograph leaf lesions, pest infestations, or nutritional chlorosis for rapid diagnostic inference with clear uncertainty ratings. Automatically alerts local human agronomists if confidence dips below 85%.")}</p>
                </div>
                <div className="pt-space-md mt-space-md bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Native Dialects")}</span>
                  <span className="font-label-lg text-label-lg text-primary font-bold">{tYo("Yorùbá · Pidgin · EN")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-space-xl bg-surface">
          <div className="max-w-7xl mx-auto px-margin md:px-margin-desktop flex flex-col gap-space-lg">
            <div className="flex flex-col gap-space-xs text-center max-w-2xl mx-auto">
              <span className="font-label-md text-label-md text-secondary uppercase tracking-wider font-semibold">{tYo("Target Ecosystem Roles")}</span>
              <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary">{tYo("Tailored Workflows for Every Stakeholder")}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">{tYo("CultivaNode provides distinct interfaces designed specifically for farmers, fleet syndicates, and off-takers.")}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-space-xs bg-surface-container p-1 rounded-xl max-w-3xl mx-auto" id="role-tab-triggers">
              <button
                className={`px-space-md py-space-sm rounded-lg font-label-md text-label-md transition-colors ${
                  activeRole === "smallholder"
                    ? "bg-surface-container-lowest text-primary shadow-sm font-semibold"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                id="tab-btn-smallholder"
                type="button"
                onClick={() => {
                  setActiveRole("smallholder");
                  showScreenToast(tYo.now("Viewing Smallholder Farmers interface."));
                }}
              >{tYo("Smallholder Farmers")}</button>
              <button
                className={`px-space-md py-space-sm rounded-lg font-label-md text-label-md transition-colors ${
                  activeRole === "commercial"
                    ? "bg-surface-container-lowest text-primary shadow-sm font-semibold"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                id="tab-btn-commercial"
                type="button"
                onClick={() => {
                  setActiveRole("commercial");
                  showScreenToast(tYo.now("Viewing Commercial Agribusinesses interface."));
                }}
              >{tYo("Commercial Agribusinesses")}</button>
              <button
                className={`px-space-md py-space-sm rounded-lg font-label-md text-label-md transition-colors ${
                  activeRole === "machinery"
                    ? "bg-surface-container-lowest text-primary shadow-sm font-semibold"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                id="tab-btn-machinery"
                type="button"
                onClick={() => {
                  setActiveRole("machinery");
                  showScreenToast(tYo.now("Viewing Machinery Fleet Owners interface."));
                }}
              >{tYo("Machinery Fleet Owners")}</button>
              <button
                className={`px-space-md py-space-sm rounded-lg font-label-md text-label-md transition-colors ${
                  activeRole === "aggregators"
                    ? "bg-surface-container-lowest text-primary shadow-sm font-semibold"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                id="tab-btn-aggregators"
                type="button"
                onClick={() => {
                  setActiveRole("aggregators");
                  showScreenToast(tYo.now("Viewing Commodity Aggregators interface."));
                }}
              >{tYo("Commodity Aggregators")}</button>
            </div>
            <div className="bg-surface-container-lowest p-space-lg lg:p-10 rounded-xl shadow-md">
              <div className={`${activeRole === "smallholder" ? "grid" : "hidden"} grid-cols-1 lg:grid-cols-12 gap-space-lg items-center`} id="role-panel-smallholder">
                <div className="lg:col-span-7 flex flex-col gap-space-md">
                  <div className="inline-flex items-center gap-1.5 text-secondary font-label-sm text-label-sm bg-surface-container px-space-sm py-1 rounded-full self-start"><Icon name="person" className="text-[16px]" />{tYo(" Smallholder & Family Clusters")}</div>
                  <h3 className="font-headline-lg text-headline-lg text-primary">{tYo("Zero Technical Barrier, Maximum Clout")}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{tYo("Family farms access tractors at cluster rates and manage seasonal inputs via SMS or local voice prompts. Every recorded harvest builds a validated track record, opening doors to low-interest micro-credit without collateral demands.")}</p>
                  <ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
                    <li className="flex items-center gap-space-xs"><Icon name="check_circle" className="text-secondary text-[18px]" />{tYo(" Pool equipment orders with neighboring farms to unlock subsidized tractor rates.")}</li>
                    <li className="flex items-center gap-space-xs"><Icon name="check_circle" className="text-secondary text-[18px]" />{tYo(" SMS & audio guidance in Yorùbá and Nigerian Pidgin for low-literacy field operations.")}</li>
                    <li className="flex items-center gap-space-xs"><Icon name="check_circle" className="text-secondary text-[18px]" />{tYo(" Verified production history shared directly with Bank of Agriculture and micro-lenders.")}</li>
                  </ul>
                </div>
                <div className="lg:col-span-5 bg-surface-container-low p-space-md rounded-xl flex flex-col gap-space-sm">
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">{tYo("Field Scenario: Iseyin Maize Hub")}</span>
                  <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm">
                    <div className="flex justify-between items-center text-label-sm font-label-sm text-on-surface-variant">
                      <span>{tYo("Maize Cluster Pool")}</span>
                      <span className="text-secondary font-bold">{tYo("14 Hectares Formed")}</span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full my-2 overflow-hidden">
                      <div className="bg-secondary h-full rounded-full w-4/5" />
                    </div>
                    <span className="font-label-sm text-label-sm text-primary font-medium">{tYo("Tractor mobilized at ₦42,000/ha (vs ₦65,000 standard market)")}</span>
                  </div>
                  <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm flex items-center justify-between">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Credit Readiness Index")}</span>
                    <span className="font-headline-sm text-headline-sm text-primary">{tYo("AA- Score")}</span>
                  </div>
                </div>
              </div>
              <div className={`${activeRole === "commercial" ? "grid" : "hidden"} grid-cols-1 lg:grid-cols-12 gap-space-lg items-center`} id="role-panel-commercial">
                <div className="lg:col-span-7 flex flex-col gap-space-md">
                  <div className="inline-flex items-center gap-1.5 text-secondary font-label-sm text-label-sm bg-surface-container px-space-sm py-1 rounded-full self-start"><Icon name="domain" className="text-[16px]" />{tYo(" Multi-Estate Enterprise")}</div>
                  <h3 className="font-headline-lg text-headline-lg text-primary">{tYo("Orchestrate Multi-Hectare Farm Portfolios")}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{tYo("Agribusiness managers gain cross-farm visibility across multiple estates. Track field teams via granular role-based permissions, monitor input usage, reconcile automated weighbridge scale tickets, and export clear financial audits.")}</p>
                  <ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
                    <li className="flex items-center gap-space-xs"><Icon name="check_circle" className="text-secondary text-[18px]" />{tYo(" Role-based access controls for agronomists, storekeepers, and account officers.")}</li>
                    <li className="flex items-center gap-space-xs"><Icon name="check_circle" className="text-secondary text-[18px]" />{tYo(" Automated bulk orders directly with accredited fertilizer blending plants.")}</li>
                    <li className="flex items-center gap-space-xs"><Icon name="check_circle" className="text-secondary text-[18px]" />{tYo(" Real-time gross and tare weighbridge tallying to stop harvest leakage at the farm gate.")}</li>
                  </ul>
                </div>
                <div className="lg:col-span-5 bg-surface-container-low p-space-md rounded-xl flex flex-col gap-space-sm">
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">{tYo("Estate Console Snapshot")}</span>
                  <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm flex flex-col gap-1">
                    <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                      <span>{tYo("Ogun Agro-Corridor Estate")}</span>
                      <span className="text-primary font-bold">{tYo("340 Hectares Active")}</span>
                    </div>
                    <span className="font-headline-sm text-headline-sm text-primary">{tYo("Cost/Ha: ₦148,200")}</span>
                    <span className="text-secondary font-label-sm text-label-sm">{tYo("↓ 14% below regional benchmark")}</span>
                  </div>
                </div>
              </div>
              <div className={`${activeRole === "machinery" ? "grid" : "hidden"} grid-cols-1 lg:grid-cols-12 gap-space-lg items-center`} id="role-panel-machinery">
                <div className="lg:col-span-7 flex flex-col gap-space-md">
                  <div className="inline-flex items-center gap-1.5 text-secondary font-label-sm text-label-sm bg-surface-container px-space-sm py-1 rounded-full self-start"><Icon name="rv_hookup" className="text-[16px]" />{tYo(" Machinery Operators & Owners")}</div>
                  <h3 className="font-headline-lg text-headline-lg text-primary">{tYo("Maximize Machine Utilization with Zero Non-Payment Risk")}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{tYo("Tractor owners eliminate wasted transport runs and avoid payment disputes. All hire funds are held in secure escrow before machinery leaves the shed, with low-loader dispatch grouped along contiguous farm corridors to keep fuel costs low.")}</p>
                  <ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
                    <li className="flex items-center gap-space-xs"><Icon name="check_circle" className="text-secondary text-[18px]" />{tYo(" Providus & Wema Bank automated escrow release upon verified GPS completion.")}</li>
                    <li className="flex items-center gap-space-xs"><Icon name="check_circle" className="text-secondary text-[18px]" />{tYo(" Corridor clustering combines adjacent jobs to cut transit diesel consumption by up to 35%.")}</li>
                    <li className="flex items-center gap-space-xs"><Icon name="check_circle" className="text-secondary text-[18px]" />{tYo(" 0% platform take-rate during the 2025 South-West pilot rollout season.")}</li>
                  </ul>
                </div>
                <div className="lg:col-span-5 bg-surface-container-low p-space-md rounded-xl flex flex-col gap-space-sm">
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">{tYo("Fleet Telemetry Status")}</span>
                  <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm flex flex-col gap-1">
                    <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                      <span>{tYo("Fleet #MF-7700 (John Deere 5075)")}</span>
                      <span className="text-secondary font-bold">{tYo("Job Escrow Verified")}</span>
                    </div>
                    <span className="font-headline-sm text-headline-sm text-secondary">{tYo("₦960,000 Guaranteed")}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("24 Ha Plowing · Oyo East Corridor")}</span>
                  </div>
                </div>
              </div>
              <div className={`${activeRole === "aggregators" ? "grid" : "hidden"} grid-cols-1 lg:grid-cols-12 gap-space-lg items-center`} id="role-panel-aggregators">
                <div className="lg:col-span-7 flex flex-col gap-space-md">
                  <div className="inline-flex items-center gap-1.5 text-secondary font-label-sm text-label-sm bg-surface-container px-space-sm py-1 rounded-full self-start"><Icon name="factory" className="text-[16px]" />{tYo(" Processing Plants & Aggregators")}</div>
                  <h3 className="font-headline-lg text-headline-lg text-primary">{tYo("Guaranteed Farm Provenance & Forward Offtake")}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{tYo("Industrial flour mills and food processors source harvest lots with verified geographical origin, complete moisture meter certificates, and zero risk of side-selling through contract-backed digital commitments.")}</p>
                  <ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
                    <li className="flex items-center gap-space-xs"><Icon name="check_circle" className="text-secondary text-[18px]" />{tYo(" Transparent, sub-meter GPS crop origin documentation for ESG and export standards.")}</li>
                    <li className="flex items-center gap-space-xs"><Icon name="check_circle" className="text-secondary text-[18px]" />{tYo(" Integrated Certificate of Analysis (COA) checks for moisture content and aflatoxin levels.")}</li>
                    <li className="flex items-center gap-space-xs"><Icon name="check_circle" className="text-secondary text-[18px]" />{tYo(" Automated offtake settlement directly through CBN-backed banking channels.")}</li>
                  </ul>
                </div>
                <div className="lg:col-span-5 bg-surface-container-low p-space-md rounded-xl flex flex-col gap-space-sm">
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">{tYo("Offtake Batch Ledger")}</span>
                  <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm flex flex-col gap-1">
                    <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                      <span>{tYo("Lot: Cassava High-Starch Chips")}</span>
                      <span className="text-primary font-bold">{tYo("120 Metric Tonnes")}</span>
                    </div>
                    <span className="font-headline-sm text-headline-sm text-primary">{tYo("Moisture: 11.8% (COA Passed)")}</span>
                    <span className="text-secondary font-label-sm text-label-sm">{tYo("Destination: Flour Mills of Nigeria Plc")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-space-xl bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-margin md:px-margin-desktop flex flex-col gap-space-lg">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
              <div>
                <div className="inline-flex items-center gap-1.5 text-secondary font-label-sm text-label-sm bg-surface-container px-space-sm py-0.5 rounded-full mb-2"><Icon name="science" className="text-[16px]" />{tYo(" Research & Development")}</div>
                <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary">{tYo("Connected Agrarian Horizons")}</h2>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="px-space-sm py-1 bg-surface-container-highest text-primary font-label-sm text-label-sm rounded-full font-bold">{tYo("Phase 2 Roadmap")}</span>
                <span className="px-space-sm py-1 bg-surface-container-highest text-primary font-label-sm text-label-sm rounded-full font-bold">{tYo("Phase 3 Specs")}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-space-sm">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="sensors" className="text-[24px]" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">{tYo("§8.4 IoT Protocol")}</span>
                    <span className="font-label-sm text-label-sm bg-surface-container px-1.5 py-0.5 rounded text-on-surface-variant font-medium">{tYo("Phase 2")}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary">{tYo("Smart LoRaWAN Irrigation")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Sub-surface capacitive moisture probes linked to solar solenoid drip valves. Automates irrigation schedules through local gateway relays across zero-cellular blind spots.")}</p>
                </div>
                <div className="pt-space-md mt-space-md bg-surface-container-low p-space-xs rounded text-center">
                  <span className="font-label-sm text-label-sm text-primary font-semibold">{tYo("Mesh Range: up to 15km")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-space-sm">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="speed" className="text-[24px]" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">{tYo("§8.5 Telematics")}</span>
                    <span className="font-label-sm text-label-sm bg-surface-container px-1.5 py-0.5 rounded text-on-surface-variant font-medium">{tYo("Phase 2")}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary">{tYo("CANbus Engine Telematics")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Direct ECU tractor plug-ins capturing real-time RPM, diesel flow rates, and active implement torque to detect idling fraud and flag predictive maintenance before field breakdowns.")}</p>
                </div>
                <div className="pt-space-md mt-space-md bg-surface-container-low p-space-xs rounded text-center">
                  <span className="font-label-sm text-label-sm text-primary font-semibold">{tYo("J1939 Standard Compliant")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-space-sm">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="satellite" className="text-[24px]" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">{tYo("§11 Remote Sensing")}</span>
                    <span className="font-label-sm text-label-sm bg-surface-container px-1.5 py-0.5 rounded text-on-surface-variant font-medium">{tYo("Phase 3")}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary">{tYo("Sentinel-2 Multispectral")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Automated 5-day NDVI, EVI, and NDRE indices to pinpoint vegetation stress, nitrogen deficits, and early armyworm damage without setting foot across all 500 hectares.")}</p>
                </div>
                <div className="pt-space-md mt-space-md bg-surface-container-low p-space-xs rounded text-center">
                  <span className="font-label-sm text-label-sm text-primary font-semibold">{tYo("10m Spatial Ground Resolution")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-space-sm">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="phishing" className="text-[24px]" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">{tYo("§20 Animal Husbandry")}</span>
                    <span className="font-label-sm text-label-sm bg-surface-container px-1.5 py-0.5 rounded text-on-surface-variant font-medium">{tYo("Phase 3")}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary">{tYo("Livestock & Catfish Engine")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Batch feed conversion ratio (FCR) tracking, broiler/layer vaccination logs, and pond water dissolved-oxygen telemetry built for the Ogun-Osun commercial aquaculture belt.")}</p>
                </div>
                <div className="pt-space-md mt-space-md bg-surface-container-low p-space-xs rounded text-center">
                  <span className="font-label-sm text-label-sm text-primary font-semibold">{tYo("Automated FCR Analytics")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-space-xl bg-surface" id="pilot-clusters">
          <div className="max-w-7xl mx-auto px-margin md:px-margin-desktop flex flex-col gap-space-lg">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">
              <div className="lg:col-span-5 flex flex-col gap-space-md">
                <span className="font-label-md text-label-md text-secondary uppercase tracking-wider font-semibold">{tYo("Regional Agrarian Deployment")}</span>
                <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary">{tYo("Active South-West Agrarian Clusters")}</h2>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{tYo("CultivaNode operates in direct partnership with Agricultural Development Programmes (ADPs) across initial pilot corridors, providing physical verification desks and certified machinery staging yards.")}</p>
                <div className="flex flex-col gap-space-xs">
                  <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-space-sm">
                      <span className="w-3 h-3 rounded-full bg-secondary" />
                      <div>
                        <div className="font-label-lg text-label-lg text-primary">{tYo("Oyo Agrarian Corridor")}</div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Saki · Iseyin · Ido Grain Hub")}</div>
                      </div>
                    </div>
                    <span className="font-label-sm text-label-sm bg-surface-container px-2 py-1 rounded text-secondary font-bold">{tYo("14,200 Ha")}</span>
                  </div>
                  <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-space-sm">
                      <span className="w-3 h-3 rounded-full bg-secondary" />
                      <div>
                        <div className="font-label-lg text-label-lg text-primary">{tYo("Ogun Cassava & Agro-Forestry")}</div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Ijebu-Ode · Sagamu · Yewa Cluster")}</div>
                      </div>
                    </div>
                    <span className="font-label-sm text-label-sm bg-surface-container px-2 py-1 rounded text-secondary font-bold">{tYo("9,850 Ha")}</span>
                  </div>
                  <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-space-sm">
                      <span className="w-3 h-3 rounded-full bg-secondary" />
                      <div>
                        <div className="font-label-lg text-label-lg text-primary">{tYo("Ondo Cocoa & Cash Crops")}</div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Owo · Idanre · Ondo City")}</div>
                      </div>
                    </div>
                    <span className="font-label-sm text-label-sm bg-surface-container px-2 py-1 rounded text-secondary font-bold">{tYo("6,120 Ha")}</span>
                  </div>
                  <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-space-sm">
                      <span className="w-3 h-3 rounded-full bg-secondary" />
                      <div>
                        <div className="font-label-lg text-label-lg text-primary">{tYo("Osun Mixed Horticultural Mesh")}</div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Ilesa · Ejigbo · Osogbo")}</div>
                      </div>
                    </div>
                    <span className="font-label-sm text-label-sm bg-surface-container px-2 py-1 rounded text-secondary font-bold">{tYo("4,400 Ha")}</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-7 flex flex-col gap-space-sm">
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-md flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs font-label-md text-label-md text-primary font-bold"><Icon name="pin_drop" className="text-[18px] text-secondary" />{tYo(" South-West Mesh Topology")}</div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Live Dispatch Relays: 34 Active")}</span>
                  </div>
                  <div className="w-full h-80 bg-cover bg-center rounded-lg shadow-inner relative flex items-end p-space-md" data-location="Ibadan, Nigeria" style={{ backgroundImage: "url('/images/screens/e373aba27198.webp')" }}>
                    <div className="bg-surface/95 backdrop-blur-sm p-space-sm rounded-lg shadow-sm flex items-center justify-between w-full">
                      <div className="flex items-center gap-space-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                        <span className="font-label-sm text-label-sm text-primary font-semibold">{tYo("Active Mesh Center: Oyo State Secretariat Hub")}</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-secondary font-bold">{tYo("Sub-Second Sync")}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm pt-1">
                    <span>{tYo("ADP Field Inspection Centers: 18")}</span>
                    <span>{tYo("Machinery Service Staging Yards: 24")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-space-lg bg-surface-container-high text-primary">
          <div className="max-w-7xl mx-auto px-margin md:px-margin-desktop">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg items-center">
              <div className="flex items-center gap-space-md">
                <div className="w-12 h-12 rounded-lg bg-surface-container-lowest flex items-center justify-center shrink-0 text-secondary">
                  <Icon name="lock_clock" className="text-[28px]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-label-lg text-label-lg text-primary font-bold">{tYo("Hash-Chained Audit Trail")}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Every financial movement, weighbridge ticket, and chemical input is cryptographically stamped.")}</span>
                </div>
              </div>
              <div className="flex items-center gap-space-md">
                <div className="w-12 h-12 rounded-lg bg-surface-container-lowest flex items-center justify-center shrink-0 text-secondary">
                  <Icon name="fmd_good" className="text-[28px]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-label-lg text-label-lg text-primary font-bold">{tYo("GPS-Timestamped Dispatch")}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Tractor and sprayer mobilization is validated against actual cadastral boundaries before escrow release.")}</span>
                </div>
              </div>
              <div className="flex items-center gap-space-md">
                <div className="w-12 h-12 rounded-lg bg-surface-container-lowest flex items-center justify-center shrink-0 text-secondary">
                  <Icon name="verified_user" className="text-[28px]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-label-lg text-label-lg text-primary font-bold">{tYo("Strict NDPA 2023 Sovereignty")}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Farmer cadastral records are never sold or shared with third parties without cryptographic consent.")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-space-xl lg:py-24 bg-primary text-on-primary">
          <div className="max-w-5xl mx-auto px-margin md:px-margin-desktop text-center flex flex-col items-center gap-space-md">
            <div className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-primary-container text-on-primary-container font-label-sm text-label-sm font-semibold"><Icon name="rocket_launch" className="text-[16px] text-secondary-fixed" />{tYo(" Deploying Across South-West Nigeria")}</div>
            <h2 className="font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg tracking-tight max-w-3xl">{tYo("Ready to Connect Your Farm or Syndicate to the Regional Mesh?")}</h2>
            <p className="font-body-lg text-body-lg text-primary-fixed-dim max-w-2xl leading-relaxed">{tYo("Join over 1,400 verified hectares across Oyo, Ogun, Ondo, and Osun. Register your farm plot in three minutes or invite an accredited ADP field agent to delineate your boundaries.")}</p>
            <div className="flex flex-wrap items-center justify-center gap-space-sm pt-space-sm">
              <Link className="inline-flex items-center gap-space-xs font-label-lg text-label-lg bg-secondary-fixed text-on-secondary-fixed px-space-lg py-3 rounded-lg shadow-md hover:bg-secondary-fixed-dim transition-colors font-bold" href={`/${lang}/sign-up`}><Icon name="how_to_reg" className="text-[20px]" />{tYo(" Register in 3 Minutes")}</Link>
              <Link className="inline-flex items-center gap-space-xs font-label-lg text-label-lg bg-primary-container text-on-primary px-space-lg py-3 rounded-lg shadow-sm hover:bg-surface-container-highest hover:text-primary transition-colors" href={`/${lang}/contact`}><Icon name="support_agent" className="text-[20px]" />{tYo(" Schedule Field Agent Visit")}</Link>
            </div>
            <div className="flex items-center gap-space-md text-on-primary-container font-body-sm text-body-sm pt-space-sm">
              <span className="flex items-center gap-1"><Icon name="check" className="text-[16px] text-secondary-fixed" />{tYo(" Free Pilot Onboarding")}</span>
              <span className="flex items-center gap-1"><Icon name="check" className="text-[16px] text-secondary-fixed" />{tYo(" Dedicated ADP Extension Support")}</span>
              <span className="flex items-center gap-1"><Icon name="check" className="text-[16px] text-secondary-fixed" />{tYo(" Zero Risk Escrow Guarantee")}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
