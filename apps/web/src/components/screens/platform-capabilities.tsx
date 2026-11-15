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
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">{tYo("CultivaNode brings crop planning, machinery and farm-hand hire, weather and farm books into one place, built with farmers in South-West Nigeria. We are in a pilot now.")}</p>
                <div className="flex flex-wrap items-center gap-space-sm pt-space-xs">
                  <a className="inline-flex items-center gap-space-xs font-label-lg text-label-lg bg-primary text-on-primary px-space-md py-3 rounded-lg shadow-sm hover:bg-primary-container transition-colors" href="#architecture-tiers"><Icon name="account_tree" className="text-[20px]" />{tYo(" Explore Architecture")}</a>
                  <Link className="inline-flex items-center gap-space-xs font-label-lg text-label-lg bg-surface-container-lowest text-primary px-space-md py-3 rounded-lg shadow-sm hover:bg-surface-container transition-colors" href={`/${lang}/sign-up`}><Icon name="how_to_reg" className="text-[20px]" />{tYo(" Create Free Account")}</Link>
                  <a className="inline-flex items-center gap-space-xs font-label-lg text-label-lg text-secondary px-space-md py-3 rounded-lg hover:bg-surface-container transition-colors" href="#pilot-clusters"><Icon name="explore" className="text-[20px]" />{tYo(" Where the Pilot Runs")}</a>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-xs pt-space-md">
                  <div className="flex flex-col p-space-sm bg-surface-container-lowest rounded-lg shadow-sm">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{tYo("Agronomic Scope")}</span>
                    <span className="font-headline-sm text-headline-sm text-primary">{tYo("15 SW Crops")}</span>
                  </div>
                  <div className="flex flex-col p-space-sm bg-surface-container-lowest rounded-lg shadow-sm">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{tYo("Pilot Hires")}</span>
                    <span className="font-headline-sm text-headline-sm text-secondary">{tYo("No Platform Fee")}</span>
                  </div>
                  <div className="flex flex-col p-space-sm bg-surface-container-lowest rounded-lg shadow-sm">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{tYo("Farm Location")}</span>
                    <span className="font-headline-sm text-headline-sm text-primary">{tYo("Pin on Map")}</span>
                  </div>
                  <div className="flex flex-col p-space-sm bg-surface-container-lowest rounded-lg shadow-sm">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{tYo("Regulatory")}</span>
                    <span className="font-headline-sm text-headline-sm text-secondary">{tYo("We Follow NDPA 2023")}</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-5 flex flex-col gap-space-md">
                <div className="relative bg-surface-container-lowest rounded-xl shadow-md p-space-md flex flex-col gap-space-md">
                  <div className="flex items-center justify-between pb-space-xs bg-surface-container-low px-space-sm py-2 rounded-lg">
                    <div className="flex items-center gap-space-xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                      <span className="font-label-sm text-label-sm text-primary font-semibold">{tYo("EXAMPLE FARM")}</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Sample view")}</span>
                  </div>
                  <div className="relative w-full h-56 rounded-lg overflow-hidden bg-surface-container flex items-center justify-center">
                    <img className="w-full h-full object-cover" data-alt="High-resolution aerial satellite composite of lush terraced agricultural plots in Oyo State Nigeria with vibrant green cassava and maize canopies overlaid with neon geometric boundary polygons and soil moisture sensor nodes under clear equatorial daylight" src="/images/screens/053c375d14c5.webp" alt="" loading="lazy" decoding="async" />
                    <div className="absolute bottom-3 left-3 bg-primary/90 text-on-primary px-space-sm py-1 rounded-lg backdrop-blur shadow-sm flex items-center gap-space-xs">
                      <Icon name="layers" className="text-[16px] text-secondary-fixed" />
                      <span className="font-label-sm text-label-sm">{tYo("Example plot · Oyo State")}</span>
                    </div>
                    <div className="absolute top-3 right-3 bg-surface-container-lowest/90 px-space-sm py-1 rounded-lg shadow-sm flex items-center gap-1">
                      <Icon name="satellite_alt" className="text-[14px] text-secondary" />
                      <span className="font-label-sm text-label-sm text-primary font-bold">{tYo("Satellite view: planned")}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-space-xs">
                    <div className="bg-surface-container-low p-space-xs rounded-lg flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Crop")}</span>
                      <span className="font-label-lg text-label-lg text-primary font-semibold">{tYo("Maize")}</span>
                    </div>
                    <div className="bg-surface-container-low p-space-xs rounded-lg flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Stage")}</span>
                      <span className="font-label-lg text-label-lg text-primary font-semibold">{tYo("V4 Vegetative")}</span>
                    </div>
                    <div className="bg-surface-container-low p-space-xs rounded-lg flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Payment")}</span>
                      <span className="font-label-lg text-label-lg text-secondary font-semibold">{tYo("Pay provider directly")}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm px-1">
                    <span className="flex items-center gap-1"><Icon name="sync" className="text-[16px] text-secondary" />{tYo(" Offline mode: coming soon")}</span>
                    <span className="text-secondary font-medium">{tYo("10-day weather forecast")}</span>
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
              <p className="font-body-md text-body-md text-on-surface-variant">{tYo("CultivaNode is built in four layers: your farm, the work on it, the money side, and the advice and data rules around it. Some parts are live in the pilot; the rest are marked as planned.")}</p>
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
                    <p className="font-body-sm text-body-sm text-on-surface-variant pt-1">{tYo("Where your farm is, what you grow, and the weather there.")}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm lg:w-2/3">
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="polyline" className="text-[16px] text-secondary" />{tYo(" Farm Pin (PostGIS)")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Drop a pin for your farm today; boundary walking comes later")}</span>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="science" className="text-[16px] text-secondary" />{tYo(" Soil Profiles")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Planned — not in the pilot yet")}</span>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="badge" className="text-[16px] text-secondary" />{tYo(" Land Records")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Planned — not in the pilot yet")}</span>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="air" className="text-[16px] text-secondary" />{tYo(" Weather Forecast")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("10-day forecast for your farm location")}</span>
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
                    <p className="font-body-sm text-body-sm text-on-surface-variant pt-1">{tYo("Crop calendars, machinery and farm-hand hire, store and inventory. Offline mode is coming soon.")}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm lg:w-2/3">
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="event_repeat" className="text-[16px] text-secondary" />{tYo(" Crop Calendar")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Season plans for 15 common South-West crops")}</span>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="precision_manufacturing" className="text-[16px] text-secondary" />{tYo(" Tractor Hire")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Hire verified tractor owners near your farm")}</span>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="qr_code_2" className="text-[16px] text-secondary" />{tYo(" Input Vouchers")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Planned — not in the pilot yet")}</span>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="wifi_off" className="text-[16px] text-secondary" />{tYo(" Offline Mode")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Coming soon: keep working without signal")}</span>
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
                    <h3 className="font-headline-md text-headline-md text-primary">{tYo("Payments & Farm Books")}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant pt-1">{tYo("Farm books for your income and costs. In the pilot you pay providers directly; escrow comes once a licensed payment partner is signed.")}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm lg:w-2/3">
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="receipt_long" className="text-[16px] text-secondary" />{tYo(" Farm Books")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Record income, costs and stock for your farm")}</span>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="lock" className="text-[16px] text-secondary" />{tYo(" Escrow (Coming)")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Money held until you confirm the job, once a licensed partner is signed")}</span>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="scale" className="text-[16px] text-secondary" />{tYo(" Weighbridge Records")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Planned — not in the pilot yet")}</span>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="history_toggle_off" className="text-[16px] text-secondary" />{tYo(" Ratings & Disputes")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Coming soon: ratings on completed jobs")}</span>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-space-md hover:shadow-md transition-shadow">
                <div className="flex items-start gap-space-md lg:w-1/3">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 text-primary">
                    <Icon name="psychology" className="text-[28px]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider">{tYo("Tier 4 · Advice & Data")}</span>
                    <h3 className="font-headline-md text-headline-md text-primary">{tYo("Intelligence & Governance")}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant pt-1">{tYo("A farm assistant in English, Pidgin or Yorùbá, and clear rules for your data.")}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm lg:w-2/3">
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="smart_toy" className="text-[16px] text-secondary" />{tYo(" Multilingual AI")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Farm assistant in English, Pidgin or Yorùbá (photo diagnosis coming)")}</span>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="supervisor_account" className="text-[16px] text-secondary" />{tYo(" Partner Dashboards")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("We will list partners here once agreements are signed")}</span>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="credit_score" className="text-[16px] text-secondary" />{tYo(" Credit Scoring")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Planned — not in the pilot yet")}</span>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><Icon name="policy" className="text-[16px] text-secondary" />{tYo(" Data Protection")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("We ask for consent before ID checks and store only masked ID numbers")}</span>
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
                <span className="font-label-md text-label-md text-secondary uppercase tracking-wider font-semibold">{tYo("Capabilities")}</span>
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
                    <span className="bg-surface-container-low text-secondary font-label-sm text-label-sm px-2 py-0.5 rounded-full font-semibold">{tYo("PostGIS")}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary">{tYo("Farm & Field Records")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Drop a pin for each farm and keep its crops and notes together. Boundary walking and land-record documents come later.")}</p>
                </div>
                <div className="pt-space-md mt-space-md bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Boundary Walking")}</span>
                  <span className="font-label-lg text-label-lg text-primary font-bold">{tYo("Coming Later")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                      <Icon name="calendar_month" className="text-[24px]" />
                    </div>
                    <span className="bg-surface-container-low text-secondary font-label-sm text-label-sm px-2 py-0.5 rounded-full font-semibold">{tYo("15 SW Crops")}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary">{tYo("Crop Calendar & Input Planner")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Season plans for 15 common South-West crops, from land preparation to harvest. The fertiliser and spray planner is coming soon.")}</p>
                </div>
                <div className="pt-space-md mt-space-md bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Fertiliser & Spray Planner")}</span>
                  <span className="font-label-lg text-label-lg text-secondary font-bold">{tYo("Coming Soon")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                      <Icon name="local_shipping" className="text-[24px]" />
                    </div>
                    <span className="bg-surface-container-low text-secondary font-label-sm text-label-sm px-2 py-0.5 rounded-full font-semibold">{tYo("No Platform Fee")}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary">{tYo("Machinery & Farm-Hand Hire")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Hire verified tractor owners and farm hands near your farm. In the pilot you pay the provider directly. Escrow (money held until you confirm the job) is coming once a licensed payment partner is signed.")}</p>
                </div>
                <div className="pt-space-md mt-space-md bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Escrow")}</span>
                  <span className="font-label-lg text-label-lg text-primary font-bold">{tYo("Not Live Yet")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                      <Icon name="menu_book" className="text-[24px]" />
                    </div>
                    <span className="bg-surface-container-low text-secondary font-label-sm text-label-sm px-2 py-0.5 rounded-full font-semibold">{tYo("Farm Books")}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary">{tYo("Inventory & Farm Ledger")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Keep your store, stock and farm books in one place: what you bought, what you used, what you paid and what you sold.")}</p>
                </div>
                <div className="pt-space-md mt-space-md bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("In the Pilot")}</span>
                  <span className="font-label-lg text-label-lg text-primary font-bold">{tYo("Store & Inventory")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                      <Icon name="cyclone" className="text-[24px]" />
                    </div>
                    <span className="bg-surface-container-low text-secondary font-label-sm text-label-sm px-2 py-0.5 rounded-full font-semibold">{tYo("10-Day Forecast")}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary">{tYo("Weather Forecast")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("A 10-day weather forecast for your farm location, so you can plan planting, spraying and harvest.")}</p>
                </div>
                <div className="pt-space-md mt-space-md bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Forecast Range")}</span>
                  <span className="font-label-lg text-label-lg text-secondary font-bold">{tYo("10 Days")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                      <Icon name="psychology_alt" className="text-[24px]" />
                    </div>
                    <span className="bg-surface-container-low text-secondary font-label-sm text-label-sm px-2 py-0.5 rounded-full font-semibold">{tYo("Farm Assistant")}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary">{tYo("AI Farm Assistant")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Ask farm questions in English, Pidgin or Yorùbá. Photo diagnosis of leaf and pest problems is coming.")}</p>
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
              <p className="font-body-md text-body-md text-on-surface-variant">{tYo("How CultivaNode fits farmers, machinery owners, agribusinesses and buyers. Planned parts are marked.")}</p>
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
                  <div className="inline-flex items-center gap-1.5 text-secondary font-label-sm text-label-sm bg-surface-container px-space-sm py-1 rounded-full self-start"><Icon name="person" className="text-[16px]" />{tYo(" Smallholder & Family Farms")}</div>
                  <h3 className="font-headline-lg text-headline-lg text-primary">{tYo("Zero Technical Barrier, Maximum Clout")}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{tYo("Family farms can hire tractors and farm hands nearby, follow a crop calendar and keep simple farm books. Credit based on your farm records is planned for later.")}</p>
                  <ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
                    <li className="flex items-center gap-space-xs"><Icon name="check_circle" className="text-secondary text-[18px]" />{tYo(" Find verified tractor owners and farm hands near your farm.")}</li>
                    <li className="flex items-center gap-space-xs"><Icon name="check_circle" className="text-secondary text-[18px]" />{tYo(" Farm assistant in English, Pidgin or Yorùbá.")}</li>
                    <li className="flex items-center gap-space-xs"><Icon name="check_circle" className="text-secondary text-[18px]" />{tYo(" Your farm records stay yours; sharing them with lenders is planned and will need your consent.")}</li>
                  </ul>
                </div>
                <div className="lg:col-span-5 bg-surface-container-low p-space-md rounded-xl flex flex-col gap-space-sm">
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">{tYo("Example: Maize Farmer")}</span>
                  <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm">
                    <div className="flex justify-between items-center text-label-sm font-label-sm text-on-surface-variant">
                      <span>{tYo("Crop Calendar")}</span>
                      <span className="text-secondary font-bold">{tYo("Maize")}</span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full my-2 overflow-hidden">
                      <div className="bg-secondary h-full rounded-full w-4/5" />
                    </div>
                    <span className="font-label-sm text-label-sm text-primary font-medium">{tYo("Tractor hire booked with a verified owner nearby; pay the owner directly")}</span>
                  </div>
                  <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm flex items-center justify-between">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Credit Profile")}</span>
                    <span className="font-headline-sm text-headline-sm text-primary">{tYo("Planned")}</span>
                  </div>
                </div>
              </div>
              <div className={`${activeRole === "commercial" ? "grid" : "hidden"} grid-cols-1 lg:grid-cols-12 gap-space-lg items-center`} id="role-panel-commercial">
                <div className="lg:col-span-7 flex flex-col gap-space-md">
                  <div className="inline-flex items-center gap-1.5 text-secondary font-label-sm text-label-sm bg-surface-container px-space-sm py-1 rounded-full self-start"><Icon name="domain" className="text-[16px]" />{tYo(" Multi-Estate Enterprise")}</div>
                  <h3 className="font-headline-lg text-headline-lg text-primary">{tYo("Orchestrate Multi-Hectare Farm Portfolios")}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{tYo("Agribusiness managers can track store and inventory and keep farm books. Team roles and weighbridge records are planned.")}</p>
                  <ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
                    <li className="flex items-center gap-space-xs"><Icon name="check_circle" className="text-secondary text-[18px]" />{tYo(" Team roles for agronomists, storekeepers and accounts staff (planned).")}</li>
                    <li className="flex items-center gap-space-xs"><Icon name="check_circle" className="text-secondary text-[18px]" />{tYo(" Store and inventory records for seed, fertiliser and chemicals.")}</li>
                    <li className="flex items-center gap-space-xs"><Icon name="check_circle" className="text-secondary text-[18px]" />{tYo(" Weighbridge tallying at the farm gate (planned).")}</li>
                  </ul>
                </div>
                <div className="lg:col-span-5 bg-surface-container-low p-space-md rounded-xl flex flex-col gap-space-sm">
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">{tYo("Example Estate View")}</span>
                  <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm flex flex-col gap-1">
                    <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                      <span>{tYo("Example Estate")}</span>
                      <span className="text-primary font-bold">{tYo("Your Farms")}</span>
                    </div>
                    <span className="font-headline-sm text-headline-sm text-primary">{tYo("Cost per hectare from your books")}</span>
                    <span className="text-secondary font-label-sm text-label-sm">{tYo("Based on your own records")}</span>
                  </div>
                </div>
              </div>
              <div className={`${activeRole === "machinery" ? "grid" : "hidden"} grid-cols-1 lg:grid-cols-12 gap-space-lg items-center`} id="role-panel-machinery">
                <div className="lg:col-span-7 flex flex-col gap-space-md">
                  <div className="inline-flex items-center gap-1.5 text-secondary font-label-sm text-label-sm bg-surface-container px-space-sm py-1 rounded-full self-start"><Icon name="rv_hookup" className="text-[16px]" />{tYo(" Machinery Operators & Owners")}</div>
                  <h3 className="font-headline-lg text-headline-lg text-primary">{tYo("Get More Jobs for Your Machines")}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{tYo("Tractor owners list their machines and get hire requests from farmers nearby. Everyone who lists equipment or receives payments is checked with their NIN, BVN and bank account. In the pilot, farmers pay you directly.")}</p>
                  <ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
                    <li className="flex items-center gap-space-xs"><Icon name="check_circle" className="text-secondary text-[18px]" />{tYo(" Escrow (money held until the farmer confirms the job) is coming once a licensed payment partner is signed.")}</li>
                    <li className="flex items-center gap-space-xs"><Icon name="check_circle" className="text-secondary text-[18px]" />{tYo(" Grouping nearby jobs to cut travel is planned.")}</li>
                    <li className="flex items-center gap-space-xs"><Icon name="check_circle" className="text-secondary text-[18px]" />{tYo(" No platform fee on hires during the pilot.")}</li>
                  </ul>
                </div>
                <div className="lg:col-span-5 bg-surface-container-low p-space-md rounded-xl flex flex-col gap-space-sm">
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">{tYo("Example Job")}</span>
                  <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm flex flex-col gap-1">
                    <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                      <span>{tYo("Tractor · Ploughing")}</span>
                      <span className="text-secondary font-bold">{tYo("Request Accepted")}</span>
                    </div>
                    <span className="font-headline-sm text-headline-sm text-secondary">{tYo("Farmer Pays You Directly")}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Example only")}</span>
                  </div>
                </div>
              </div>
              <div className={`${activeRole === "aggregators" ? "grid" : "hidden"} grid-cols-1 lg:grid-cols-12 gap-space-lg items-center`} id="role-panel-aggregators">
                <div className="lg:col-span-7 flex flex-col gap-space-md">
                  <div className="inline-flex items-center gap-1.5 text-secondary font-label-sm text-label-sm bg-surface-container px-space-sm py-1 rounded-full self-start"><Icon name="factory" className="text-[16px]" />{tYo(" Processing Plants & Aggregators")}</div>
                  <h3 className="font-headline-lg text-headline-lg text-primary">{tYo("Buy Directly from Farmers")}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{tYo("Buyers can find produce listed by farmers on the marketplace. Quality certificates, origin records and forward contracts are planned.")}</p>
                  <ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
                    <li className="flex items-center gap-space-xs"><Icon name="check_circle" className="text-secondary text-[18px]" />{tYo(" Origin records for each lot (planned).")}</li>
                    <li className="flex items-center gap-space-xs"><Icon name="check_circle" className="text-secondary text-[18px]" />{tYo(" Moisture and aflatoxin certificates (planned).")}</li>
                    <li className="flex items-center gap-space-xs"><Icon name="check_circle" className="text-secondary text-[18px]" />{tYo(" Pay at checkout by card, bank transfer or USSD through a licensed payment provider.")}</li>
                  </ul>
                </div>
                <div className="lg:col-span-5 bg-surface-container-low p-space-md rounded-xl flex flex-col gap-space-sm">
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">{tYo("Example Listing")}</span>
                  <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm flex flex-col gap-1">
                    <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                      <span>{tYo("Lot: Cassava High-Starch Chips")}</span>
                      <span className="text-primary font-bold">{tYo("Quantity set by seller")}</span>
                    </div>
                    <span className="font-headline-sm text-headline-sm text-primary">{tYo("Quality certificate: planned")}</span>
                    <span className="text-secondary font-label-sm text-label-sm">{tYo("Buyer: your business")}</span>
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
                  <span className="font-label-sm text-label-sm text-primary font-semibold">{tYo("Planned")}</span>
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
                  <span className="font-label-sm text-label-sm text-primary font-semibold">{tYo("Planned")}</span>
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
                  <span className="font-label-sm text-label-sm text-primary font-semibold">{tYo("Planned")}</span>
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
                  <span className="font-label-sm text-label-sm text-primary font-semibold">{tYo("Planned")}</span>
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
                <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary">{tYo("Pilot States in South-West Nigeria")}</h2>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{tYo("The pilot runs in Oyo, Ogun, Osun, Ondo, Ekiti and Lagos, built with farmers there. We will list partners here once agreements are signed.")}</p>
                <div className="flex flex-col gap-space-xs">
                  <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-space-sm">
                      <span className="w-3 h-3 rounded-full bg-secondary" />
                      <div>
                        <div className="font-label-lg text-label-lg text-primary">{tYo("Oyo State")}</div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Open for pilot sign-up")}</div>
                      </div>
                    </div>
                    <span className="font-label-sm text-label-sm bg-surface-container px-2 py-1 rounded text-secondary font-bold">{tYo("Pilot")}</span>
                  </div>
                  <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-space-sm">
                      <span className="w-3 h-3 rounded-full bg-secondary" />
                      <div>
                        <div className="font-label-lg text-label-lg text-primary">{tYo("Ogun State")}</div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Open for pilot sign-up")}</div>
                      </div>
                    </div>
                    <span className="font-label-sm text-label-sm bg-surface-container px-2 py-1 rounded text-secondary font-bold">{tYo("Pilot")}</span>
                  </div>
                  <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-space-sm">
                      <span className="w-3 h-3 rounded-full bg-secondary" />
                      <div>
                        <div className="font-label-lg text-label-lg text-primary">{tYo("Osun & Ondo States")}</div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Open for pilot sign-up")}</div>
                      </div>
                    </div>
                    <span className="font-label-sm text-label-sm bg-surface-container px-2 py-1 rounded text-secondary font-bold">{tYo("Pilot")}</span>
                  </div>
                  <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-space-sm">
                      <span className="w-3 h-3 rounded-full bg-secondary" />
                      <div>
                        <div className="font-label-lg text-label-lg text-primary">{tYo("Ekiti & Lagos States")}</div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Open for pilot sign-up")}</div>
                      </div>
                    </div>
                    <span className="font-label-sm text-label-sm bg-surface-container px-2 py-1 rounded text-secondary font-bold">{tYo("Pilot")}</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-7 flex flex-col gap-space-sm">
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-md flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs font-label-md text-label-md text-primary font-bold"><Icon name="pin_drop" className="text-[18px] text-secondary" />{tYo(" South-West Pilot Area")}</div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Map for illustration")}</span>
                  </div>
                  <div className="w-full h-80 bg-cover bg-center rounded-lg shadow-inner relative flex items-end p-space-md" data-location="Ibadan, Nigeria" style={{ backgroundImage: "url('/images/screens/e373aba27198.webp')" }}>
                    <div className="bg-surface/95 backdrop-blur-sm p-space-sm rounded-lg shadow-sm flex items-center justify-between w-full">
                      <div className="flex items-center gap-space-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                        <span className="font-label-sm text-label-sm text-primary font-semibold">{tYo("Pilot: Oyo, Ogun, Osun, Ondo, Ekiti, Lagos")}</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-secondary font-bold">{tYo("Join the Pilot")}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm pt-1">
                    <span>{tYo("Partners: none signed yet")}</span>
                    <span>{tYo("Machinery: hired from verified local owners")}</span>
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
                  <span className="font-label-lg text-label-lg text-primary font-bold">{tYo("Farm Records")}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Records are kept in a Postgres database (Supabase) with row-level security.")}</span>
                </div>
              </div>
              <div className="flex items-center gap-space-md">
                <div className="w-12 h-12 rounded-lg bg-surface-container-lowest flex items-center justify-center shrink-0 text-secondary">
                  <Icon name="fmd_good" className="text-[28px]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-label-lg text-label-lg text-primary font-bold">{tYo("Proof of Work (Coming Soon)")}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Check-in plus photos with location and time for each job.")}</span>
                </div>
              </div>
              <div className="flex items-center gap-space-md">
                <div className="w-12 h-12 rounded-lg bg-surface-container-lowest flex items-center justify-center shrink-0 text-secondary">
                  <Icon name="verified_user" className="text-[28px]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-label-lg text-label-lg text-primary font-bold">{tYo("We Follow NDPA 2023")}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("We ask for consent before ID checks, store only masked ID numbers, and you can ask to download or delete your data.")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-space-xl lg:py-24 bg-primary text-on-primary">
          <div className="max-w-5xl mx-auto px-margin md:px-margin-desktop text-center flex flex-col items-center gap-space-md">
            <div className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-primary-container text-on-primary-container font-label-sm text-label-sm font-semibold"><Icon name="rocket_launch" className="text-[16px] text-secondary-fixed" />{tYo(" Pilot in South-West Nigeria")}</div>
            <h2 className="font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg tracking-tight max-w-3xl">{tYo("Ready to Join the Pilot?")}</h2>
            <p className="font-body-lg text-body-lg text-primary-fixed-dim max-w-2xl leading-relaxed">{tYo("Farmers, tractor owners and farm hands in Oyo, Ogun, Osun, Ondo, Ekiti and Lagos can sign up for the pilot today.")}</p>
            <div className="flex flex-wrap items-center justify-center gap-space-sm pt-space-sm">
              <Link className="inline-flex items-center gap-space-xs font-label-lg text-label-lg bg-secondary-fixed text-on-secondary-fixed px-space-lg py-3 rounded-lg shadow-md hover:bg-secondary-fixed-dim transition-colors font-bold" href={`/${lang}/sign-up`}><Icon name="how_to_reg" className="text-[20px]" />{tYo(" Join the Pilot")}</Link>
              <Link className="inline-flex items-center gap-space-xs font-label-lg text-label-lg bg-primary-container text-on-primary px-space-lg py-3 rounded-lg shadow-sm hover:bg-surface-container-highest hover:text-primary transition-colors" href={`/${lang}/contact`}><Icon name="support_agent" className="text-[20px]" />{tYo(" Contact Us")}</Link>
            </div>
            <div className="flex items-center gap-space-md text-on-primary-container font-body-sm text-body-sm pt-space-sm">
              <span className="flex items-center gap-1"><Icon name="check" className="text-[16px] text-secondary-fixed" />{tYo(" Free Pilot Onboarding")}</span>
              <span className="flex items-center gap-1"><Icon name="check" className="text-[16px] text-secondary-fixed" />{tYo(" Built with South-West Farmers")}</span>
              <span className="flex items-center gap-1"><Icon name="check" className="text-[16px] text-secondary-fixed" />{tYo(" No Platform Fee on Pilot Hires")}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
