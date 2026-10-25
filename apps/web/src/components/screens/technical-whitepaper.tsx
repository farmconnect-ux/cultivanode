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
              <span>{tYo("Download PDF (v2.4)")}</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="border-b border-surface-container-high bg-gradient-to-b from-surface-container-low to-surface-container-lowest py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container text-on-primary-container font-label-sm text-label-sm mb-4">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="font-semibold">{tYo("TECHNICAL SPECIFICATION · REF: CN-ENG-WP-2026.4")}</span>
          </div>
          <h1 className="font-headline-xl text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary tracking-tight leading-tight mb-4">{tYo("CultivaNode: Verifiable Agrarian Mesh & Digital Rail Operating System")}</h1>
          <p className="font-body-lg text-lg md:text-xl text-on-surface-variant leading-relaxed max-w-4xl mb-6">{tYo("A Cadastral GIS, Degree-Day Phenology, Cryptographic Double-Entry Ledger, and Transit-Optimization Infrastructure for Smallholder Agro-Corridors in South-West Nigeria.")}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-surface-container-low border border-surface-container-high text-body-sm">
            <div>
              <span className="text-outline block font-label-sm text-xs uppercase tracking-wider">{tYo("Document Version")}</span>
              <span className="font-semibold text-on-surface font-mono">{tYo("v2.4.1 (Stable Release)")}</span>
            </div>
            <div>
              <span className="text-outline block font-label-sm text-xs uppercase tracking-wider">{tYo("Classification")}</span>
              <span className="font-semibold text-on-surface">{tYo("Public Technical Standard")}</span>
            </div>
            <div>
              <span className="text-outline block font-label-sm text-xs uppercase tracking-wider">{tYo("Target Agro-Ecology")}</span>
              <span className="font-semibold text-on-surface">{tYo("SW Nigeria Belt (Oyo/Ogun/Osun)")}</span>
            </div>
            <div>
              <span className="text-outline block font-label-sm text-xs uppercase tracking-wider">{tYo("Merkle Proof Root")}</span>
              <span className="font-semibold text-primary font-mono truncate block" title="0x7f9a2b881c20e14d9b">
                0x7f9a2b881c2...
              </span>
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
          <p className="font-body-md text-on-surface-variant leading-relaxed">{tYo("Agricultural productivity across Nigeria's South-West agrarian corridor (spanning Oyo, Osun, Ogun, Ondo, Ekiti, and Lagos states) suffers not from agronomic unwillingness or land scarcity, but from systemic institutional coordination failures. Smallholder farmers cultivate an estimated 3.8 million hectares with average cassava yields of 11.2 MT/ha and maize yields of 1.6 MT/ha—substantially below the theoretical agro-ecological yield potentials of 28 MT/ha and 5.5 MT/ha respectively.")}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="p-5 rounded-xl bg-surface-container-low border border-surface-container-high space-y-2">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-2">
                <Icon name="agriculture" className="text-[24px]" />
              </div>
              <h3 className="font-headline-sm text-lg font-bold text-primary">{tYo("The Mechanization Trap")}</h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed">{tYo("Informal middleman brokers extract up to 40% surcharges on tractor tillage hires. Fleet syndicates incur ruinous deadhead transit distances (frequently exceeding 35 km one-way) due to dispersed unclustered bookings, causing frequent operator no-shows.")}</p>
            </div>
            <div className="p-5 rounded-xl bg-surface-container-low border border-surface-container-high space-y-2">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary mb-2">
                <Icon name="map" className="text-[24px]" />
              </div>
              <h3 className="font-headline-sm text-lg font-bold text-primary">{tYo("The Delineation Gap")}</h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed">{tYo("Land parcels lack sub-meter cadastral boundaries. Verbal hectare estimations suffer a 30–55% variance error, leading directly to toxic agrochemical over-dosing, seed under-population, and unenforceable offtake quantity covenants.")}</p>
            </div>
            <div className="p-5 rounded-xl bg-surface-container-low border border-surface-container-high space-y-2">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-tertiary mb-2">
                <Icon name="payments" className="text-[24px]" />
              </div>
              <h3 className="font-headline-sm text-lg font-bold text-primary">{tYo("The Liquidity Deficit")}</h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed">{tYo("Commercial tier-1 lenders view smallholders as uninsurable credit risks due to the lack of auditable double-entry accounting records, verifiable proof of field work, and secure milestone escrow conduits.")}</p>
            </div>
          </div>
        </article>

        {/* Section 2: Mathematical Formulations */}
        <article id="sec-2" className="space-y-6">
          <div className="flex items-center gap-2 text-secondary font-label-md text-label-md font-bold uppercase tracking-wider">
            <Icon name="calculate" className="text-[18px]" />
            <span>{tYo("Section 2")}</span>
          </div>
          <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary">{tYo("2. Mathematical & Algorithmic Formulations")}</h2>
          <p className="font-body-md text-on-surface-variant leading-relaxed">{tYo("CultivaNode operates on deterministic, open-source mathematical models implemented in high-performance WebAssembly and TypeScript engines within the ")}<code className="bg-surface-container px-1.5 py-0.5 rounded text-primary font-mono text-sm">@cultivanode/shared</code>{tYo(" monorepo package.")}</p>

          {/* Subsection 2.1 */}
          <div className="p-6 rounded-xl bg-surface-container-low border border-surface-container-high space-y-3">
            <h3 className="font-headline-sm text-xl font-bold text-primary flex items-center gap-2">
              <span className="font-mono text-secondary text-base">&sect;2.1</span>
              <span>{tYo("Geodesic Cadastral Delineation & Spherical Polygon Area")}</span>
            </h3>
            <p className="font-body-sm text-on-surface-variant leading-relaxed">{tYo("To prevent perimeter encroachment disputes, plot coordinates collected via GNSS walks are projected onto the WGS-84 reference ellipsoid. The enclosed surface area ")}<code className="font-mono text-xs">A</code>{tYo(" is computed via spherical excess:")}</p>
            <div className="bg-surface-container-lowest p-4 rounded-lg border border-surface-container font-mono text-sm text-primary overflow-x-auto text-center">
              {tYo("$$A = R^2 \\cdot \\left| \\sum_{i=1}^{n} (\\lambda_{i+1} - \\lambda_{i-1}) \\cdot \\sin(\\phi_i) \\right| \\div 2$$")}
            </div>
            <p className="font-body-sm text-on-surface-variant text-xs">{tYo("Where ")}<code className="font-mono">R &approx; 6,378,137m</code>, <code className="font-mono">&phi;_i</code>{tYo(" denotes geodetic latitude, and ")}<code className="font-mono">&lambda;_i</code>{tYo(" denotes geodetic longitude. A closure threshold of ε < 1.5m is enforced before polygon certification.")}</p>
          </div>

          {/* Subsection 2.2 */}
          <div className="p-6 rounded-xl bg-surface-container-low border border-surface-container-high space-y-3">
            <h3 className="font-headline-sm text-xl font-bold text-primary flex items-center gap-2">
              <span className="font-mono text-secondary text-base">&sect;2.2</span>
              <span>{tYo("Degree-Day Thermal Phenology & Crop Water Balance")}</span>
            </h3>
            <p className="font-body-sm text-on-surface-variant leading-relaxed">{tYo("Crop growth stages (vegetative, flowering, tuber bulking, maturity) are tracked using cumulative Growing Degree Days (GDD) rather than calendar days, accounting for micro-climatic thermal fluctuations:")}</p>
            <div className="bg-surface-container-lowest p-4 rounded-lg border border-surface-container font-mono text-sm text-primary overflow-x-auto text-center">
              {tYo("$$\\text{GDD} = \\sum_{t=1}^{D} \\max\\left(0, \\; \\frac{T_{\\max}(t) + T_{\\min}(t)}{2} - T_{\\text{base}}\\right)$$")}
            </div>
            <p className="font-body-sm text-on-surface-variant text-xs">{tYo("Baseline temperature thresholds are calibrated: TME-419 Cassava (Tbase = 14°C), SAMMAZ-15 Maize (Tbase = 10°C), and Cocoa (Tbase = 18°C). Crop evapotranspiration is modeled via Penman-Monteith reference evaporation: ETc = Kc(t) · ET0.")}</p>
          </div>

          {/* Subsection 2.3 */}
          <div className="p-6 rounded-xl bg-surface-container-low border border-surface-container-high space-y-3">
            <h3 className="font-headline-sm text-xl font-bold text-primary flex items-center gap-2">
              <span className="font-mono text-secondary text-base">&sect;2.3</span>
              <span>{tYo("Tractor Fleet Transit Minimization & Deadhead Reduction")}</span>
            </h3>
            <p className="font-body-sm text-on-surface-variant leading-relaxed">{tYo("The machinery scheduling engine solves a constrained Vehicle Routing Problem with Time Windows (VRPTW) across regional syndicate hubs:")}</p>
            <div className="bg-surface-container-lowest p-4 rounded-lg border border-surface-container font-mono text-sm text-primary overflow-x-auto text-center">
              {tYo("$$\\min \\left[ \\sum_{k \\in \\mathcal{K}} \\sum_{(i,j) \\in \\mathcal{E}} d_{ij} \\cdot x_{ijk} + \\alpha \\sum_{i \\in \\mathcal{V}} (s_i - a_i)^+ \\right]$$")}
            </div>
            <p className="font-body-sm text-on-surface-variant text-xs">{tYo("Subject to tractor implement compatibility, fuel range constraints, and soil moisture operability windows (< 28% volumetric moisture).")}</p>
          </div>
        </article>

        {/* Section 3: Cadastral GIS & Delineation Engine */}
        <article id="sec-3" className="space-y-4">
          <div className="flex items-center gap-2 text-secondary font-label-md text-label-md font-bold uppercase tracking-wider">
            <Icon name="satellite_alt" className="text-[18px]" />
            <span>{tYo("Section 3")}</span>
          </div>
          <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary">{tYo("3. Cadastral GIS, Satellite Ingestion & Ground Truth")}</h2>
          <p className="font-body-md text-on-surface-variant leading-relaxed">{tYo("CultivaNode integrates real-time ground truth with orbital remote sensing. State ADP enumerators walk plot boundaries using offline mobile GNSS logging at 1Hz frequency. Once synchronized, the cloud engine executes topology validation:")}</p>
          <ul className="list-disc list-inside space-y-2 font-body-sm text-on-surface-variant pl-2">
            <li><strong>{tYo("Self-Intersection Rejection:")}</strong>{tYo(" Disallows concave complex self-crossing loops using PostGIS ")}<code className="bg-surface-container px-1 py-0.5 rounded font-mono text-xs">ST_IsValid</code>.</li>
            <li><strong>{tYo("Encroachment Check:")}</strong>{tYo(" Calculates spatial intersection against registered adjacent tenure polygons (")}<code className="bg-surface-container px-1 py-0.5 rounded font-mono text-xs">ST_Overlaps</code>{tYo(" < 0.01% tolerance).")}</li>
            <li><strong>{tYo("Multi-Spectral Validation:")}</strong>{tYo(" Samples ESA Sentinel-2 L2A 10-meter surface reflectance bands every 5 days to compute Normalized Difference Vegetation Index (NDVI) and Red Edge Index (NDRE).")}</li>
          </ul>
        </article>

        {/* Section 4: Cryptographic Ledger & Escrow Protocol */}
        <article id="sec-4" className="space-y-4">
          <div className="flex items-center gap-2 text-secondary font-label-md text-label-md font-bold uppercase tracking-wider">
            <Icon name="account_balance" className="text-[18px]" />
            <span>{tYo("Section 4")}</span>
          </div>
          <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary">{tYo("4. Cryptographic Double-Entry Ledger & Providus/Wema Escrow")}</h2>
          <p className="font-body-md text-on-surface-variant leading-relaxed">{tYo("Every economic transaction within CultivaNode settles into an immutable, double-entry append-only journal. Accounts are strictly typed into Assets, Liabilities, Equity, Revenue, and Expense:")}</p>
          <div className="p-5 rounded-xl bg-surface-container-low border border-surface-container-high space-y-3">
            <h4 className="font-headline-sm text-base font-bold text-primary">{tYo("The 3-Stage Escrow Release State Machine")}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-body-sm">
              <div className="p-3 rounded-lg bg-surface-container-lowest border border-surface-container">
                <span className="font-semibold text-primary block">{tYo("Stage 1: Commitment (100%)")}</span>
                <span className="text-on-surface-variant text-xs">{tYo("Funds held in Providus Bank escrow trust vault upon job booking agreement.")}</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-lowest border border-surface-container">
                <span className="font-semibold text-secondary block">{tYo("Stage 2: Mobilization (30%)")}</span>
                <span className="text-on-surface-variant text-xs">{tYo("Released to operator diesel pool when tractor arrives within 150m of parcel boundary.")}</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-lowest border border-surface-container">
                <span className="font-semibold text-tertiary block">{tYo("Stage 3: Proof of Work (70%)")}</span>
                <span className="text-on-surface-variant text-xs">{tYo("Released upon telemetry completion verification (≥95% polygon coverage) and farmer PIN sign-off.")}</span>
              </div>
            </div>
            <p className="text-body-sm text-on-surface-variant text-xs pt-1">
              <strong>{tYo("Automated 48-Hour Force Majeure Rule:")}</strong>{tYo(" If equipment fails to mobilize within 48 hours of scheduled window, 100% of escrow principal is credited back to the farmer's wallet without penalty.")}</p>
          </div>
        </article>

        {/* Section 5: Offline-First Edge Sync */}
        <article id="sec-5" className="space-y-4">
          <div className="flex items-center gap-2 text-secondary font-label-md text-label-md font-bold uppercase tracking-wider">
            <Icon name="sync" className="text-[18px]" />
            <span>{tYo("Section 5")}</span>
          </div>
          <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary">{tYo("5. Offline-First Edge Synchronization & IoT Ingress")}</h2>
          <p className="font-body-md text-on-surface-variant leading-relaxed">{tYo("Rural agricultural tracts frequently experience multi-day cellular outages. CultivaNode deploys a local SQLite engine synchronized using Conflict-Free Replicated Data Types (CRDTs) and PowerSync streaming replication:")}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high space-y-2">
              <h4 className="font-headline-sm text-base font-bold text-primary flex items-center gap-2">
                <Icon name="lock" className="text-secondary text-[18px]" />
                <span>{tYo("HMAC-SHA256 Telemetry Ingress")}</span>
              </h4>
              <p className="font-body-sm text-on-surface-variant leading-relaxed text-xs">{tYo("In-field IoT weather nodes and soil probes sign payload rollups using device-specific pre-shared keys. Signatures are verified with constant-time equality checks; timestamps skewed > 15 minutes are discarded to eliminate replay attacks.")}</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high space-y-2">
              <h4 className="font-headline-sm text-base font-bold text-primary flex items-center gap-2">
                <Icon name="sms" className="text-primary text-[18px]" />
                <span>{tYo("SMS & USSD Fallback Bridge")}</span>
              </h4>
              <p className="font-body-sm text-on-surface-variant leading-relaxed text-xs">{tYo("For non-smartphone smallholders, critical advisory alerts, task assignments, and escrow confirmation OTPs are transmitted across the Termii GSM gateway in English and Yoruba.")}</p>
            </div>
          </div>
        </article>

        {/* Section 6: NDPA 2023 Compliance */}
        <article id="sec-6" className="space-y-4">
          <div className="flex items-center gap-2 text-secondary font-label-md text-label-md font-bold uppercase tracking-wider">
            <Icon name="gavel" className="text-[18px]" />
            <span>{tYo("Section 6")}</span>
          </div>
          <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary">{tYo("6. Nigeria Data Protection Act (NDPA 2023) Statutory Compliance")}</h2>
          <p className="font-body-md text-on-surface-variant leading-relaxed">{tYo("CultivaNode establishes absolute legal data sovereignty for all Nigerian smallholder producers:")}</p>
          <div className="p-5 rounded-xl bg-surface-container-low border border-surface-container-high space-y-2 font-body-sm text-on-surface-variant">
            <p><strong>{tYo("1. Zero Data Commercialization:")}</strong>{tYo(" Cadastral coordinates, soil analysis metrics, and transaction ledgers remain the sovereign property of the farmer and will never be monetized, rented, or transferred to third-party ad networks.")}</p>
            <p><strong>{tYo("2. Right of Data Portability:")}</strong>{tYo(" Any registered producer or fleet owner can download an immediate, unredacted JSON archive of their entire digital footprint via the ")}<code className="bg-surface-container px-1.5 py-0.5 rounded font-mono text-xs">/api/account/export</code>{tYo(" endpoint.")}</p>
            <p><strong>{tYo("3. Cryptographic Anonymization:")}</strong>{tYo(" Regional agricultural research and extension bodies only access aggregated, zero-knowledge k-anonymized cluster statistics (k ≥ 25).")}</p>
          </div>
        </article>

        {/* Section 7: Conclusion & Reference Callouts */}
        <article id="sec-7" className="space-y-6 pt-6 border-t border-surface-container-high">
          <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary">{tYo("7. Citation & Document Governance")}</h2>
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high font-mono text-xs text-on-surface-variant space-y-1">
            <p>{tYo("@techreport{cultivanode2026whitepaper,")}</p>
            <p className="pl-4">{tYo("title = {CultivaNode: Verifiable Agrarian Mesh and Digital Rail Operating System},")}</p>
            <p className="pl-4">{tYo("author = {CultivaNode Engineering and Agronomy Architecture Group},")}</p>
            <p className="pl-4">{tYo("institution = {CultivaNode Infrastructure Ltd, Lagos / Ibadan},")}</p>
            <p className="pl-4">{tYo("year = {2026},")}</p>
            <p className="pl-4">{tYo("version = {2.4.1},")}</p>
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
                <span>{tYo("Institutional Partner Dossier")}</span>
              </a>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- downloads a file from an API route, not a page */}
              <a
                href="/api/documents/whitepaper?download=1"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md transition-colors shadow-sm"
              >
                <Icon name="download" className="text-[18px]" />
                <span>{tYo("Download Complete Whitepaper (PDF)")}</span>
              </a>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
