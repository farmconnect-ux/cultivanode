"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";
import { phrasebook } from "@/i18n/marketing";
import YO from "@/i18n/yo-marketing/technical-whitepaper";

const tYo = phrasebook(YO);

export function TechnicalWhitepaper({ lang = "en" }: ScreenProps) {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="screen bg-surface-container-lowest text-on-surface">
      {/* Top Header / Meta Bar */}
      <header className="border-b border-surface-container-high bg-surface-container-low/70 backdrop-blur-md sticky top-0 z-30 py-3 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
          <nav className="flex items-center gap-2 text-body-sm font-body-sm text-on-surface-variant">
            <Link href={`/${lang}`} className="hover:text-primary transition-colors flex items-center gap-1">
              <Icon name="home" className="text-[16px]" />
              <span>{tYo("CultivaNode")}</span>
            </Link>
            <span className="text-outline">/</span>
            <Link href={`/${lang}/platform`} className="hover:text-primary transition-colors">{tYo("Platform Architecture")}</Link>
            <span className="text-outline">/</span>
            <span className="text-on-surface font-semibold">{tYo("Technical Whitepaper")}</span>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm shadow-sm transition-colors"
            >
              <Icon name="print" className="text-[16px]" />
              <span>{tYo("Print Specification")}</span>
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- downloads a file from an API route, not a page */}
            <a
              href="/api/documents/whitepaper?download=1"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-sm text-label-sm shadow-sm transition-colors"
            >
              <Icon name="picture_as_pdf" className="text-[16px]" />
              <span>{tYo("Download PDF (Draft)")}</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="border-b border-surface-container-high bg-gradient-to-b from-surface-container-low to-surface-container-lowest py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container text-on-primary-container font-label-sm text-label-sm mb-4">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="font-semibold">{tYo("TECHNICAL OVERVIEW · DRAFT")}</span>
          </div>
          <h1 className="font-headline-xl text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary tracking-tight leading-tight mb-4">{tYo("CultivaNode: How the Platform Works and What Is Planned")}</h1>
          <p className="font-body-lg text-lg md:text-xl text-on-surface-variant leading-relaxed max-w-4xl mb-6">{tYo("What runs in the South-West Nigeria pilot today, and the design for features that are planned but not live yet.")}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-surface-container-low border border-surface-container-high text-body-sm">
            <div>
              <span className="text-outline block font-label-sm text-xs uppercase tracking-wider">{tYo("Document Version")}</span>
              <span className="font-semibold text-on-surface font-mono">{tYo("Draft (November 2026)")}</span>
            </div>
            <div>
              <span className="text-outline block font-label-sm text-xs uppercase tracking-wider">{tYo("Classification")}</span>
              <span className="font-semibold text-on-surface">{tYo("Public draft")}</span>
            </div>
            <div>
              <span className="text-outline block font-label-sm text-xs uppercase tracking-wider">{tYo("Target Agro-Ecology")}</span>
              <span className="font-semibold text-on-surface">{tYo("SW Nigeria Belt (Oyo/Ogun/Osun)")}</span>
            </div>
            <div>
              <span className="text-outline block font-label-sm text-xs uppercase tracking-wider">{tYo("Run By")}</span>
              <span className="font-semibold text-on-surface">{tYo("Excel Palace Global Concept (BN 7455859)")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Document Body */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-16">
        {/* Section 1: Executive Summary */}
        <article id="sec-1" className="space-y-4">
          <div className="flex items-center gap-2 text-secondary font-label-md text-label-md font-bold uppercase tracking-wider">
            <Icon name="bookmark" className="text-[18px]" />
            <span>{tYo("Section 1")}</span>
          </div>
          <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary">{tYo("1. Executive Summary & Structural Problem Formulation")}</h2>
          <p className="font-body-md text-on-surface-variant leading-relaxed">{tYo("Farming in South-West Nigeria (Oyo, Osun, Ogun, Ondo, Ekiti and Lagos) is held back less by land or effort than by coordination: finding a tractor at the right time, knowing the size of a farm, and keeping records that lenders accept.")}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="p-5 rounded-xl bg-surface-container-low border border-surface-container-high space-y-2">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-2">
                <Icon name="agriculture" className="text-[24px]" />
              </div>
              <h3 className="font-headline-sm text-lg font-bold text-primary">{tYo("The Mechanization Trap")}</h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed">{tYo("Smallholders often pay middlemen extra for tractor hire, and tractors do not always come when the rains start. Machinery owners lose money driving long distances between small farms.")}</p>
            </div>
            <div className="p-5 rounded-xl bg-surface-container-low border border-surface-container-high space-y-2">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary mb-2">
                <Icon name="map" className="text-[24px]" />
              </div>
              <h3 className="font-headline-sm text-lg font-bold text-primary">{tYo("The Delineation Gap")}</h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed">{tYo("Most farms have no survey plan, and farm sizes are often estimated by eye. A wrong size means buying too much or too little seed, fertiliser and chemicals.")}</p>
            </div>
            <div className="p-5 rounded-xl bg-surface-container-low border border-surface-container-high space-y-2">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-tertiary mb-2">
                <Icon name="payments" className="text-[24px]" />
              </div>
              <h3 className="font-headline-sm text-lg font-bold text-primary">{tYo("The Liquidity Deficit")}</h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed">{tYo("Lenders find it hard to lend to smallholders who have no written farm records and no proof of the work done on the farm.")}</p>
            </div>
          </div>
        </article>

        {/* Section 2: Mathematical Formulations */}
        <article id="sec-2" className="space-y-6">
          <div className="flex items-center gap-2 text-secondary font-label-md text-label-md font-bold uppercase tracking-wider">
            <Icon name="calculate" className="text-[18px]" />
            <span>{tYo("Section 2")}</span>
          </div>
          <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary">{tYo("2. Methods (Planned Design)")}</h2>
          <p className="font-body-md text-on-surface-variant leading-relaxed">{tYo("Shared logic is written in TypeScript in the ")}<code className="bg-surface-container px-1.5 py-0.5 rounded text-primary font-mono text-sm">@cultivanode/shared</code>{tYo(" package. The methods in this section are planned designs, not features live in the pilot.")}</p>

          {/* Subsection 2.1 */}
          <div className="p-6 rounded-xl bg-surface-container-low border border-surface-container-high space-y-3">
            <h3 className="font-headline-sm text-xl font-bold text-primary flex items-center gap-2">
              <span className="font-mono text-secondary text-base">&sect;2.1</span>
              <span>{tYo("Farm Area from a Boundary Walk (Planned)")}</span>
            </h3>
            <p className="font-body-sm text-on-surface-variant leading-relaxed">{tYo("Today the app saves a pin for each farm. Boundary walking comes later: the points you walk will be placed on the WGS-84 reference ellipsoid, and the enclosed surface area ")}<code className="font-mono text-xs">A</code>{tYo(" will be computed by spherical excess:")}</p>
            <div className="bg-surface-container-lowest p-4 rounded-lg border border-surface-container font-mono text-sm text-primary overflow-x-auto text-center">
              {tYo("$$A = R^2 \\cdot \\left| \\sum_{i=1}^{n} (\\lambda_{i+1} - \\lambda_{i-1}) \\cdot \\sin(\\phi_i) \\right| \\div 2$$")}
            </div>
            <p className="font-body-sm text-on-surface-variant text-xs">{tYo("Where ")}<code className="font-mono">R &approx; 6,378,137m</code>, <code className="font-mono">&phi;_i</code>{tYo(" denotes geodetic latitude, and ")}<code className="font-mono">&lambda;_i</code>{tYo(" denotes geodetic longitude. In the design, a boundary must close (ε < 1.5m) before its area is saved.")}</p>
          </div>

          {/* Subsection 2.2 */}
          <div className="p-6 rounded-xl bg-surface-container-low border border-surface-container-high space-y-3">
            <h3 className="font-headline-sm text-xl font-bold text-primary flex items-center gap-2">
              <span className="font-mono text-secondary text-base">&sect;2.2</span>
              <span>{tYo("Degree-Day Phenology & Crop Water Balance (Planned)")}</span>
            </h3>
            <p className="font-body-sm text-on-surface-variant leading-relaxed">{tYo("The pilot crop calendar covers 15 common South-West crops today. A planned upgrade would track growth stages (vegetative, flowering, tuber bulking, maturity) using cumulative Growing Degree Days (GDD) instead of calendar days:")}</p>
            <div className="bg-surface-container-lowest p-4 rounded-lg border border-surface-container font-mono text-sm text-primary overflow-x-auto text-center">
              {tYo("$$\\text{GDD} = \\sum_{t=1}^{D} \\max\\left(0, \\; \\frac{T_{\\max}(t) + T_{\\min}(t)}{2} - T_{\\text{base}}\\right)$$")}
            </div>
            <p className="font-body-sm text-on-surface-variant text-xs">{tYo("Proposed base temperatures, to be checked against field data: TME-419 Cassava (Tbase = 14°C), SAMMAZ-15 Maize (Tbase = 10°C) and Cocoa (Tbase = 18°C). Crop water use would be modelled with Penman-Monteith reference evaporation: ETc = Kc(t) · ET0.")}</p>
          </div>

          {/* Subsection 2.3 */}
          <div className="p-6 rounded-xl bg-surface-container-low border border-surface-container-high space-y-3">
            <h3 className="font-headline-sm text-xl font-bold text-primary flex items-center gap-2">
              <span className="font-mono text-secondary text-base">&sect;2.3</span>
              <span>{tYo("Tractor Routing to Cut Empty Trips (Planned)")}</span>
            </h3>
            <p className="font-body-sm text-on-surface-variant leading-relaxed">{tYo("A planned machinery scheduler would group nearby bookings by solving a Vehicle Routing Problem with Time Windows (VRPTW):")}</p>
            <div className="bg-surface-container-lowest p-4 rounded-lg border border-surface-container font-mono text-sm text-primary overflow-x-auto text-center">
              {tYo("$$\\min \\left[ \\sum_{k \\in \\mathcal{K}} \\sum_{(i,j) \\in \\mathcal{E}} d_{ij} \\cdot x_{ijk} + \\alpha \\sum_{i \\in \\mathcal{V}} (s_i - a_i)^+ \\right]$$")}
            </div>
            <p className="font-body-sm text-on-surface-variant text-xs">{tYo("Constraints would include implement compatibility, fuel range and soil moisture (for example, no tillage above 28% volumetric moisture).")}</p>
          </div>
        </article>

        {/* Section 3: Cadastral GIS & Delineation Engine */}
        <article id="sec-3" className="space-y-4">
          <div className="flex items-center gap-2 text-secondary font-label-md text-label-md font-bold uppercase tracking-wider">
            <Icon name="satellite_alt" className="text-[18px]" />
            <span>{tYo("Section 3")}</span>
          </div>
          <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary">{tYo("3. Farm Locations & Mapping")}</h2>
          <p className="font-body-md text-on-surface-variant leading-relaxed">{tYo("Records are kept in a Postgres database (Supabase) with PostGIS for farm locations and row-level security. Today each farm is saved as a pin. The checks below are planned for when boundary walking arrives:")}</p>
          <ul className="list-disc list-inside space-y-2 font-body-sm text-on-surface-variant pl-2">
            <li><strong>{tYo("Self-Intersection Rejection:")}</strong>{tYo(" Reject boundaries that cross themselves, using PostGIS ")}<code className="bg-surface-container px-1 py-0.5 rounded font-mono text-xs">ST_IsValid</code>.</li>
            <li><strong>{tYo("Overlap Check:")}</strong>{tYo(" Flag boundaries that overlap a neighbouring farm saved on CultivaNode (")}<code className="bg-surface-container px-1 py-0.5 rounded font-mono text-xs">ST_Overlaps</code>{tYo(" < 0.01% tolerance).")}</li>
            <li><strong>{tYo("Satellite Crop Health:")}</strong>{tYo(" Use free ESA Sentinel-2 imagery (10-metre bands, about every 5 days) to compute crop health indices (NDVI and NDRE).")}</li>
          </ul>
        </article>

        {/* Section 4: Cryptographic Ledger & Escrow Protocol */}
        <article id="sec-4" className="space-y-4">
          <div className="flex items-center gap-2 text-secondary font-label-md text-label-md font-bold uppercase tracking-wider">
            <Icon name="account_balance" className="text-[18px]" />
            <span>{tYo("Section 4")}</span>
          </div>
          <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary">{tYo("4. Farm Books & Escrow (Escrow Planned)")}</h2>
          <p className="font-body-md text-on-surface-variant leading-relaxed">{tYo("Farm books are live in the pilot. When you hire in the pilot, you pay the tractor owner or farm hand directly. Escrow (money held until you confirm the job) is coming once a licensed payment partner is signed. This is the planned escrow design:")}</p>
          <div className="p-5 rounded-xl bg-surface-container-low border border-surface-container-high space-y-3">
            <h4 className="font-headline-sm text-base font-bold text-primary">{tYo("Planned 3-Stage Escrow Release")}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-body-sm">
              <div className="p-3 rounded-lg bg-surface-container-lowest border border-surface-container">
                <span className="font-semibold text-primary block">{tYo("Stage 1: Commitment (100%)")}</span>
                <span className="text-on-surface-variant text-xs">{tYo("Payment would be held by a licensed payment partner (not signed yet) when the job is booked.")}</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-lowest border border-surface-container">
                <span className="font-semibold text-secondary block">{tYo("Stage 2: Mobilization (30%)")}</span>
                <span className="text-on-surface-variant text-xs">{tYo("Would be released to the operator when the tractor checks in at the farm.")}</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-lowest border border-surface-container">
                <span className="font-semibold text-tertiary block">{tYo("Stage 3: Proof of Work (70%)")}</span>
                <span className="text-on-surface-variant text-xs">{tYo("Would be released after proof of work (check-in and photos with location and time) and the farmer confirms the job.")}</span>
              </div>
            </div>
            <p className="text-body-sm text-on-surface-variant text-xs pt-1">
              <strong>{tYo("Planned No-Show Rule:")}</strong>{tYo(" If the equipment does not arrive within 48 hours of the agreed time, the full payment would go back to the farmer.")}</p>
          </div>
        </article>

        {/* Section 5: Offline-First Edge Sync */}
        <article id="sec-5" className="space-y-4">
          <div className="flex items-center gap-2 text-secondary font-label-md text-label-md font-bold uppercase tracking-wider">
            <Icon name="sync" className="text-[18px]" />
            <span>{tYo("Section 5")}</span>
          </div>
          <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary">{tYo("5. Offline Mode, Farm Sensors & SMS (Planned)")}</h2>
          <p className="font-body-md text-on-surface-variant leading-relaxed">{tYo("Rural farms can lose network for days. Offline mode is coming soon: the plan is a local store on the phone that syncs with the server when network returns.")}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high space-y-2">
              <h4 className="font-headline-sm text-base font-bold text-primary flex items-center gap-2">
                <Icon name="lock" className="text-secondary text-[18px]" />
                <span>{tYo("Farm Sensor Data (Planned)")}</span>
              </h4>
              <p className="font-body-sm text-on-surface-variant leading-relaxed text-xs">{tYo("Planned: weather stations and soil probes on farms would sign their readings with a per-device key (HMAC-SHA256), and readings with timestamps more than 15 minutes off would be rejected.")}</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high space-y-2">
              <h4 className="font-headline-sm text-base font-bold text-primary flex items-center gap-2">
                <Icon name="sms" className="text-primary text-[18px]" />
                <span>{tYo("SMS & USSD (Planned)")}</span>
              </h4>
              <p className="font-body-sm text-on-surface-variant leading-relaxed text-xs">{tYo("Planned: alerts and job reminders by SMS for farmers without smartphones, in English and Yorùbá. USSD is also planned.")}</p>
            </div>
          </div>
        </article>

        {/* Section 6: NDPA 2023 Compliance */}
        <article id="sec-6" className="space-y-4">
          <div className="flex items-center gap-2 text-secondary font-label-md text-label-md font-bold uppercase tracking-wider">
            <Icon name="gavel" className="text-[18px]" />
            <span>{tYo("Section 6")}</span>
          </div>
          <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary">{tYo("6. Your Data and the Nigeria Data Protection Act 2023")}</h2>
          <p className="font-body-md text-on-surface-variant leading-relaxed">{tYo("We follow the Nigeria Data Protection Act 2023: we ask for consent before ID checks, store only masked ID numbers, and you can ask to download or delete your data.")}</p>
          <div className="p-5 rounded-xl bg-surface-container-low border border-surface-container-high space-y-2 font-body-sm text-on-surface-variant">
            <p><strong>{tYo("1. No Selling of Data:")}</strong>{tYo(" Your farm locations, records and transactions belong to you. We do not sell or rent them to advertisers.")}</p>
            <p><strong>{tYo("2. Right of Data Portability:")}</strong>{tYo(" You can ask for a copy of your data, or ask us to delete it.")}</p>
            <p><strong>{tYo("3. Research Sharing:")}</strong>{tYo(" We do not share data with research or extension bodies today. If we do in future, it will only be grouped totals in which no single farm can be identified.")}</p>
          </div>
        </article>

        {/* Section 7: Conclusion & Reference Callouts */}
        <article id="sec-7" className="space-y-6 pt-6 border-t border-surface-container-high">
          <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary">{tYo("7. Citation & Document Governance")}</h2>
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high font-mono text-xs text-on-surface-variant space-y-1">
            <p>{tYo("@techreport{cultivanode2026whitepaper,")}</p>
            <p className="pl-4">{tYo("title = {CultivaNode: How the Platform Works and What Is Planned},")}</p>
            <p className="pl-4">{tYo("author = {CultivaNode},")}</p>
            <p className="pl-4">{tYo("institution = {Excel Palace Global Concept (BN 7455859)},")}</p>
            <p className="pl-4">{tYo("year = {2026},")}</p>
            <p className="pl-4">{tYo("version = {Draft, November 2026},")}</p>
            <p className="pl-4">{tYo("url = {https://cultivanode.com/en/whitepaper}")}</p>
            <p>&#125;</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 print:hidden">
            <Link
              href={`/${lang}/platform`}
              className="inline-flex items-center gap-2 font-label-md text-label-md text-primary font-semibold hover:underline"
            >
              <Icon name="arrow_back" className="text-[18px]" />
              <span>{tYo("Explore Interactive Architecture Tiers")}</span>
            </Link>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- downloads a file from an API route, not a page */}
              <a
                href="/api/documents/institutional-whitepaper"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors"
              >
                <Icon name="corporate_fare" className="text-[18px]" />
                <span>{tYo("Partner Information (Draft)")}</span>
              </a>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- downloads a file from an API route, not a page */}
              <a
                href="/api/documents/whitepaper?download=1"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md transition-colors shadow-sm"
              >
                <Icon name="download" className="text-[18px]" />
                <span>{tYo("Download Whitepaper Draft (PDF)")}</span>
              </a>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
