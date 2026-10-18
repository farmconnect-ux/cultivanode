"use client";

// Ported from the "institutional_partnerships_ecosystem_cultivanode" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { useState } from "react";
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";
import { showScreenToast } from "@/components/screens/screen-toast";
import { phrasebook } from "@/i18n/marketing";
import YO from "@/i18n/yo-marketing/partnerships-page";

const tYo = phrasebook(YO);

export function PartnershipsPage(_props: ScreenProps) {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    showScreenToast(tYo.now("Institutional Inquiry Transmitted"), tYo.now("EoI ref #CN-INS-2025-089 logged. Docket will be issued within 48 business hours."));
  };
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <div className="w-full bg-surface-container-low py-3 px-6 lg:px-12">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md">
              <span className="inline-flex items-center gap-1.5 text-primary"><Icon name="account_balance" className="text-[16px]" />{tYo(" Institutional")}</span>
              <Icon name="chevron_right" className="text-[14px]" />
              <span className="hover:text-primary transition-colors cursor-pointer">{tYo("Strategic Partnerships")}</span>
              <Icon name="chevron_right" className="text-[14px]" />
              <span className="text-on-surface font-semibold bg-surface-container px-2 py-0.5 rounded">{tYo("Ecosystem Accreditation")}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 font-label-sm text-label-sm text-secondary bg-surface-container-lowest px-2.5 py-1 rounded-full shadow-sm"><span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />{tYo(" CBN Escrow Gateway: Live & Synced")}</span>
              <span className="hidden sm:inline-flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant"><Icon name="verified" className="text-[15px]" />{tYo(" NDPA 2023 Tier-IV Registered")}</span>
            </div>
          </div>
        </div>
        <section className="w-full py-12 lg:py-20 px-6 lg:px-12 relative overflow-hidden bg-surface">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm tracking-wide"><Icon name="hub" className="text-[18px]" />{tYo(" REGIONAL AGRARIAN INFRASTRUCTURE PROTOCOL")}</div>
                <h1 className="font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg text-on-surface tracking-tight text-balance leading-tight">{tYo("Collaborate with the ")}<span className="text-primary font-bold">{tYo("Agrarian Operating System")}</span>{tYo(" for South-West Nigeria")}</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">{tYo("Partner with CultivaNode to deliver verified agricultural extension, digital escrow clearing, data-backed lending, and sovereign food security telemetry across regional agricultural clusters.")}</p>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <a className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-primary-container text-on-primary hover:bg-primary transition-all shadow-md font-label-lg text-label-lg" href="#inquiry-form"><Icon name="corporate_fare" className="text-[20px]" />{tYo(" Inquire for Institutional Partnership")}</a>
                  <a className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-all shadow-sm font-label-lg text-label-lg" href="/api/documents/institutional-whitepaper?download=1"><Icon name="picture_as_pdf" className="text-[20px]" />{tYo(" Download Institutional Whitepaper (PDF)")}</a>
                </div>
                <div className="flex items-center gap-4 text-on-surface-variant font-label-sm text-label-sm pt-2">
                  <span className="flex items-center gap-1.5"><Icon name="check_circle" className="text-secondary text-[16px]" />{tYo(" Providus Bank PLC")}</span>
                  <span className="flex items-center gap-1.5"><Icon name="check_circle" className="text-secondary text-[16px]" />{tYo(" Wema Bank ALAT")}</span>
                  <span className="flex items-center gap-1.5"><Icon name="check_circle" className="text-secondary text-[16px]" />{tYo(" OYSADEP & OGADEP Validated")}</span>
                </div>
              </div>
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="relative rounded-2xl overflow-hidden shadow-lg bg-surface-container-low p-6">
                  <div className="flex items-center justify-between pb-4">
                    <div className="flex items-center gap-2">
                      <Icon name="radar" className="text-primary text-[22px]" />
                      <span className="font-headline-sm text-headline-sm text-on-surface">{tYo("Telemetry Command Desk")}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">{tYo("Active Node Swarm")}</span>
                  </div>
                  <div className="relative w-full h-44 rounded-xl overflow-hidden mb-5">
                    <img className="w-full h-full object-cover" data-alt="High-resolution aerial satellite composite showing verified agricultural hectares in Oyo and Ogun States Nigeria with digital parcel overlays, irrigation telemetry boundaries, and emerald green maize and cassava farm plots under radiant equatorial daylight." src="/images/screens/029e48e8e1c1.webp" alt="" loading="lazy" decoding="async" />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex items-end p-3">
                      <span className="text-on-primary font-label-sm text-label-sm flex items-center gap-1.5"><Icon name="satellite_alt" className="text-[16px]" />{tYo(" Sentinel-2 Multi-spectral NDVI Scan: 0.82 High Vigor")}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 bg-surface-container-lowest rounded-xl shadow-sm">
                      <span className="font-label-sm text-label-sm text-on-surface-variant block uppercase tracking-wider">{tYo("Validated Landmass")}</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="font-metric-num text-metric-num text-primary font-bold">14,820+</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Ha")}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-secondary font-label-sm text-label-sm"><Icon name="trending_up" className="text-[14px]" />{tYo(" +1,450 Ha this cycle")}</div>
                    </div>
                    <div className="p-3.5 bg-surface-container-lowest rounded-xl shadow-sm">
                      <span className="font-label-sm text-label-sm text-on-surface-variant block uppercase tracking-wider">{tYo("Active Clusters")}</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="font-metric-num text-metric-num text-on-surface font-bold">28</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Nodes")}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-primary font-label-sm text-label-sm"><Icon name="location_on" className="text-[14px]" />{tYo(" Oyo, Ogun, Osun, Ondo")}</div>
                    </div>
                    <div className="p-3.5 bg-surface-container-lowest rounded-xl shadow-sm">
                      <span className="font-label-sm text-label-sm text-on-surface-variant block uppercase tracking-wider">{tYo("Escrow Settlement")}</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="font-headline-lg text-headline-lg text-on-surface font-bold">{tYo("Tier 1")}</span>
                        <span className="font-label-sm text-label-sm text-secondary font-semibold">{tYo("Rails")}</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant block mt-1">{tYo("Providus & Wema Secured")}</span>
                    </div>
                    <div className="p-3.5 bg-surface-container-lowest rounded-xl shadow-sm">
                      <span className="font-label-sm text-label-sm text-on-surface-variant block uppercase tracking-wider">{tYo("Data Sovereignty")}</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="font-headline-lg text-headline-lg text-secondary font-bold">{tYo("NDPA")}</span>
                        <span className="font-label-sm text-label-sm text-on-surface font-bold">2023</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-secondary block mt-1">{tYo("Consent Vault Certified")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-16 px-6 lg:px-12 bg-surface-container-lowest">
          <div className="max-w-7xl mx-auto flex flex-col gap-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex flex-col gap-3 max-w-2xl">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">{tYo("Document §4.17 Framework")}</span>
                <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface">{tYo("Strategic Institutional Partnership Pillars")}</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">{tYo("CultivaNode operates modular institutional pathways designed to interface seamlessly with ministerial mandates, banking credit criteria, international development protocols, and industrial agro-processing specifications.")}</p>
              </div>
              <div className="shrink-0 flex items-center gap-2 px-3 py-2 bg-surface-container rounded-lg font-label-md text-label-md text-primary"><Icon name="layers" className="text-[20px]" />{tYo(" Multi-Tenant Architecture")}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-surface rounded-2xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center">
                      <Icon name="account_balance" className="text-[26px]" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface font-semibold">{tYo("Track 01 • Ministerial")}</span>
                  </div>
                  <h3 className="font-headline-lg text-headline-lg text-on-surface">{tYo("State Governments & ADPs (OYSADEP, OGADEP)")}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">{tYo("Comprehensive operational digitisation for state agricultural development programmes. Empowering state extension directors with real-time regional crop census, geofenced input subsidy vouchers, verifiable farmer registries, and zero-leakage intervention execution.")}</p>
                  <div className="flex flex-col gap-2.5 pt-2">
                    <div className="flex items-start gap-2.5">
                      <Icon name="check_circle" className="text-secondary text-[18px] mt-0.5" />
                      <span className="font-body-sm text-body-sm text-on-surface"><strong>{tYo("Geofenced E-Vouchers:")}</strong>{tYo(" Biometrically bound agro-dealer redemption prevents input diversion.")}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Icon name="check_circle" className="text-secondary text-[18px] mt-0.5" />
                      <span className="font-body-sm text-body-sm text-on-surface"><strong>{tYo("Biometric Census:")}</strong>{tYo(" Geotagged farm boundaries with verified NIN-linked farmer identifiers.")}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Icon name="check_circle" className="text-secondary text-[18px] mt-0.5" />
                      <span className="font-body-sm text-body-sm text-on-surface"><strong>{tYo("Zero-Leakage Allocations:")}</strong>{tYo(" Automated tracking from state central warehouse to farm gate.")}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-4 bg-surface-container-low -mx-8 -mb-8 p-6 rounded-b-2xl flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{tYo("Target Partners")}</span>
                  <span className="font-label-md text-label-md text-primary font-bold">{tYo("Oyo OYSADEP • Ogun OGADEP • Osun ADP")}</span>
                </div>
              </div>
              <div className="bg-surface rounded-2xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-secondary text-on-secondary flex items-center justify-center">
                      <Icon name="payments" className="text-[26px]" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface font-semibold">{tYo("Track 02 • Financial")}</span>
                  </div>
                  <h3 className="font-headline-lg text-headline-lg text-on-surface">{tYo("Commercial Banks, Microfinance & Ag-Lenders")}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">{tYo("De-risking agrarian loan portfolios with verifiable agronomic underwriting. Access pre-screened borrower dossiers backed by historical double-entry farm books, satellite NDVI verification, and automated loan recovery via forward off-take escrow.")}</p>
                  <div className="flex flex-col gap-2.5 pt-2">
                    <div className="flex items-start gap-2.5">
                      <Icon name="check_circle" className="text-secondary text-[18px] mt-0.5" />
                      <span className="font-body-sm text-body-sm text-on-surface"><strong>{tYo("Automated Escrow Recovery:")}</strong>{tYo(" Priority lien settlement upon mill gate weight-bridge intake.")}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Icon name="check_circle" className="text-secondary text-[18px] mt-0.5" />
                      <span className="font-body-sm text-body-sm text-on-surface"><strong>{tYo("Synthetic Credit Scoring:")}</strong>{tYo(" 24-month agronomic yield track records cross-referenced with weather risk.")}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Icon name="check_circle" className="text-secondary text-[18px] mt-0.5" />
                      <span className="font-body-sm text-body-sm text-on-surface"><strong>{tYo("In-Season Growth Audits:")}</strong>{tYo(" Weekly vegetative vigor alerts highlighting distress before default.")}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-4 bg-surface-container-low -mx-8 -mb-8 p-6 rounded-b-2xl flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{tYo("Integration Rails")}</span>
                  <span className="font-label-md text-label-md text-secondary font-bold">{tYo("Providus • Wema ALAT • Bank of Agriculture")}</span>
                </div>
              </div>
              <div className="bg-surface rounded-2xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-tertiary-container text-on-tertiary flex items-center justify-center">
                      <Icon name="public" className="text-[26px]" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface font-semibold">{tYo("Track 03 • Multilateral")}</span>
                  </div>
                  <h3 className="font-headline-lg text-headline-lg text-on-surface">{tYo("Development Agencies & NGOs (World Bank, IITA)")}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">{tYo("Auditable grant disbursement and real-time social impact metrics. Deliver programmatic funding with tamper-evident impact monitoring, gender & youth inclusion tracking, and immutable milestone-based seed capital disbursement trails.")}</p>
                  <div className="flex flex-col gap-2.5 pt-2">
                    <div className="flex items-start gap-2.5">
                      <Icon name="check_circle" className="text-secondary text-[18px] mt-0.5" />
                      <span className="font-body-sm text-body-sm text-on-surface"><strong>{tYo("Impact Verification:")}</strong>{tYo(" Cryptographically logged training attendance and yield delta tracking.")}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Icon name="check_circle" className="text-secondary text-[18px] mt-0.5" />
                      <span className="font-body-sm text-body-sm text-on-surface"><strong>{tYo("Demographic Inclusivity:")}</strong>{tYo(" Automated disaggregation for female-headed farming syndicates.")}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Icon name="check_circle" className="text-secondary text-[18px] mt-0.5" />
                      <span className="font-body-sm text-body-sm text-on-surface"><strong>{tYo("Auditable Grant Rail:")}</strong>{tYo(" Provable expenditure from institutional account directly to verified input purchase.")}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-4 bg-surface-container-low -mx-8 -mb-8 p-6 rounded-b-2xl flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{tYo("Accreditation")}</span>
                  <span className="font-label-md text-label-md text-primary font-bold">{tYo("World Bank APPEALS • AFDB • IITA Resilient Yields")}</span>
                </div>
              </div>
              <div className="bg-surface rounded-2xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-inverse-surface text-inverse-on-surface flex items-center justify-center">
                      <Icon name="precision_manufacturing" className="text-[26px]" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface font-semibold">{tYo("Track 04 • Commercial")}</span>
                  </div>
                  <h3 className="font-headline-lg text-headline-lg text-on-surface">{tYo("Industrial Processors & Food Millers")}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">{tYo("Industrial-grade raw material security for major millers and agro-allied conglomerates. Establish long-term structured off-take contracts, quality-tested farmgate aggregation, digital weighbridge integration, and end-to-end origin traceability.")}</p>
                  <div className="flex flex-col gap-2.5 pt-2">
                    <div className="flex items-start gap-2.5">
                      <Icon name="check_circle" className="text-secondary text-[18px] mt-0.5" />
                      <span className="font-body-sm text-body-sm text-on-surface"><strong>{tYo("Contract Hedging:")}</strong>{tYo(" Forward delivery guarantees locked via tripartite conditional escrow.")}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Icon name="check_circle" className="text-secondary text-[18px] mt-0.5" />
                      <span className="font-body-sm text-body-sm text-on-surface"><strong>{tYo("Quality Sorting at Node:")}</strong>{tYo(" Moisture analysis and starch content grading logged before freight haulage.")}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Icon name="check_circle" className="text-secondary text-[18px] mt-0.5" />
                      <span className="font-body-sm text-body-sm text-on-surface"><strong>{tYo("Digital Weighbridge API:")}</strong>{tYo(" Instant mass verification at receiving hopper automatically releases funds.")}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-4 bg-surface-container-low -mx-8 -mb-8 p-6 rounded-b-2xl flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{tYo("Processors")}</span>
                  <span className="font-label-md text-label-md text-primary font-bold">{tYo("Flour Mills of Nigeria • Nestlé Ag-Supply • Olam Agri")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-16 px-6 lg:px-12 bg-surface">
          <div className="max-w-7xl mx-auto flex flex-col gap-12">
            <div className="flex flex-col gap-3 max-w-3xl">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">{tYo("Architecture & Trust (§21.3 & §22)")}</span>
              <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface">{tYo("Federated Data Mesh & Sovereign Settlement Protocols")}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">{tYo("CultivaNode provides strict cryptographic boundary protections, decoupling farmer identity and land tenure rights from raw institutional data consumption while automating settlement through regulated commercial banks.")}</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm flex flex-col justify-between">
                <div className="flex flex-col gap-5">
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="api" className="text-[28px]" />
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block mb-1">{tYo("Module 01 • Interoperability")}</span>
                    <h3 className="font-headline-md text-headline-md text-on-surface font-bold">{tYo("API & Webhook Gateways")}</h3>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("RESTful and gRPC endpoints delivering read-only consented credit dossiers, geocadastral geoJSON exports, and batch voucher disbursement execution. Built with rate-limited TLS 1.3 mutual auth.")}</p>
                  <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-2 font-mono text-[11px] text-on-surface">
                    <div className="flex items-center justify-between text-secondary">
                      <span className="font-bold">{tYo("GET /api/v2/cadastre/clusters")}</span>
                      <span className="text-label-sm">{tYo("200 OK")}</span>
                    </div>
                    <div className="text-on-surface-variant truncate">{tYo("Auth: Bearer jwt_institution_token")}</div>
                    <div className="text-primary truncate">{tYo("{ \"cluster_id\": \"OY-IBD-04\", \"hectares\": 840.5 }")}</div>
                  </div>
                </div>
                <div className="pt-6 mt-6 flex items-center gap-2 text-primary font-label-md text-label-md"><Icon name="verified" className="text-[18px]" />{tYo(" OpenAPI 3.1 & ISO 19115 Geospatial")}</div>
              </div>
              <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm flex flex-col justify-between">
                <div className="flex flex-col gap-5">
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-secondary">
                    <Icon name="lock" className="text-[28px]" />
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider block mb-1">{tYo("Module 02 • Data Governance")}</span>
                    <h3 className="font-headline-md text-headline-md text-on-surface font-bold">{tYo("NDPA 2023 Consent Vault")}</h3>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Farmer-controlled, cryptographic, revocable consent tokens. No unconsented bulk telemetry exposure. Farmers grant granular access to lenders via USSD PIN authentication with automatic expiration.")}</p>
                  <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm font-semibold text-on-surface">{tYo("Consent Hash Validation")}</span>
                      <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">{tYo("NDPC Registered")}</span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div className="bg-secondary h-full rounded-full" style={{ width: "100%" }} />
                    </div>
                    <span className="text-[11px] text-on-surface-variant">{tYo("Zero Raw PII Storage • Ephemeral Dossiers")}</span>
                  </div>
                </div>
                <div className="pt-6 mt-6 flex items-center gap-2 text-secondary font-label-md text-label-md"><Icon name="gavel" className="text-[18px]" />{tYo(" Full NDPA 2023 Statutory Compliance")}</div>
              </div>
              <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm flex flex-col justify-between">
                <div className="flex flex-col gap-5">
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary-container">
                    <Icon name="account_balance_wallet" className="text-[28px]" />
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider block mb-1">{tYo("Module 03 • Clearing & Settlement")}</span>
                    <h3 className="font-headline-md text-headline-md text-on-surface font-bold">{tYo("CBN Escrow Clearing Rails")}</h3>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Tripartite escrow settlement guarantees zero advance capital risk for off-takers and immediate syndicate payouts. Programmed disbursement via Providus Bank and Wema Bank ALAT Agri settlement rails.")}</p>
                  <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center justify-between text-on-surface font-label-sm text-label-sm">
                      <span>{tYo("Escrow Collateral State")}</span>
                      <span className="text-secondary font-bold">{tYo("100% Ring-Fenced")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                      <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">{tYo("Providus Special Escrow Account")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                      <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">{tYo("Wema Instant Sub-Wallet Clearing")}</span>
                    </div>
                  </div>
                </div>
                <div className="pt-6 mt-6 flex items-center gap-2 text-primary font-label-md text-label-md"><Icon name="account_balance" className="text-[18px]" />{tYo(" CBN Tier-1 Deposit Guarantee")}</div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-16 px-6 lg:px-12 bg-surface-container-low">
          <div className="max-w-7xl mx-auto flex flex-col gap-10">
            <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">{tYo("Accreditation Registry")}</span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">{tYo("Verified Institutional Ecosystem")}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">{tYo("CultivaNode actively integrates with state agricultural ministries, apex research centers, seed councils, and licensed financial settlement institutions.")}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col items-center justify-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-primary">
                  <Icon name="nature_people" className="text-[30px]" />
                </div>
                <div>
                  <div className="font-label-md text-label-md text-on-surface font-bold">{tYo("OYSADEP")}</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">{tYo("Oyo State Ag Dev Prog")}</div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm text-[10px]">{tYo("Active Node")}</span>
              </div>
              <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col items-center justify-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-primary">
                  <Icon name="agriculture" className="text-[30px]" />
                </div>
                <div>
                  <div className="font-label-md text-label-md text-on-surface font-bold">{tYo("OGADEP")}</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">{tYo("Ogun State Ag Dev Prog")}</div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm text-[10px]">{tYo("Verified Registry")}</span>
              </div>
              <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col items-center justify-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-secondary">
                  <Icon name="account_balance" className="text-[30px]" />
                </div>
                <div>
                  <div className="font-label-md text-label-md text-on-surface font-bold">{tYo("Providus Bank")}</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">{tYo("Agri-Desk Clearing")}</div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm text-[10px]">{tYo("Tier-1 Escrow")}</span>
              </div>
              <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col items-center justify-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-primary">
                  <Icon name="currency_exchange" className="text-[30px]" />
                </div>
                <div>
                  <div className="font-label-md text-label-md text-on-surface font-bold">{tYo("Wema Bank")}</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">{tYo("ALAT Agri Rails")}</div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm text-[10px]">{tYo("Settlement Host")}</span>
              </div>
              <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col items-center justify-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-tertiary">
                  <Icon name="spa" className="text-[30px]" />
                </div>
                <div>
                  <div className="font-label-md text-label-md text-on-surface font-bold">{tYo("NASC")}</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">{tYo("Seed Council Nigeria")}</div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm text-[10px]">{tYo("Genetic Trace")}</span>
              </div>
              <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col items-center justify-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-primary">
                  <Icon name="biotech" className="text-[30px]" />
                </div>
                <div>
                  <div className="font-label-md text-label-md text-on-surface font-bold">{tYo("IITA Ibadan")}</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">{tYo("Research Affiliate")}</div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm text-[10px]">{tYo("Soil / Phenotype")}</span>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-16 px-6 lg:px-12 bg-surface-container-lowest">
          <div className="max-w-7xl mx-auto flex flex-col gap-12">
            <div className="flex flex-col gap-3 max-w-2xl">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">{tYo("Deployment Lifecycle")}</span>
              <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface">{tYo("Institutional Onboarding & Vetting Journey")}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">{tYo("From bilateral mandate to live field operations, our 4-phase synchronization ensures governance rigor, cryptographic data security, and seamless field officer integration.")}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
              <div className="bg-surface p-6 rounded-2xl flex flex-col justify-between shadow-sm relative">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-label-lg">01</span>
                    <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">{tYo("Days 1–7")}</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">{tYo("Expression of Interest (EOI) & Compliance")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Initial submission of programmatic mandate, verification of regulatory standing (CBN / State ExCo / Multilateral charter), and preliminary node compatibility analysis.")}</p>
                </div>
                <div className="pt-4 mt-4 flex items-center gap-1.5 text-secondary font-label-sm text-label-sm"><Icon name="verified" className="text-[16px]" />{tYo(" SLA & Charter Clearance")}</div>
              </div>
              <div className="bg-surface p-6 rounded-2xl flex flex-col justify-between shadow-sm relative">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-label-lg">02</span>
                    <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">{tYo("Days 8–14")}</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">{tYo("Data Governance & NDPA Bilateral")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Execution of bilateral Data Protection Service Agreements compliant with NDPA 2023. Definition of authorized telemetry scopes, encryption protocols, and token expiration rules.")}</p>
                </div>
                <div className="pt-4 mt-4 flex items-center gap-1.5 text-secondary font-label-sm text-label-sm"><Icon name="shield" className="text-[16px]" />{tYo(" NDPC Registered Agreement")}</div>
              </div>
              <div className="bg-surface p-6 rounded-2xl flex flex-col justify-between shadow-sm relative">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-label-lg">03</span>
                    <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">{tYo("Days 15–21")}</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">{tYo("Sandbox API & Protocol Alignment")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Provisioning of institutional API sandbox keys, mock escrow settlement pipeline configuration, and custom webhook registration for cluster weight and moisture updates.")}</p>
                </div>
                <div className="pt-4 mt-4 flex items-center gap-1.5 text-secondary font-label-sm text-label-sm"><Icon name="terminal" className="text-[16px]" />{tYo(" mTLS Credentials Issued")}</div>
              </div>
              <div className="bg-surface p-6 rounded-2xl flex flex-col justify-between shadow-sm relative">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-label-lg">04</span>
                    <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">{tYo("Live Launch")}</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">{tYo("Field Deployment & Officer Sync")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Mobilisation across designated cluster nodes. Field extension agents equipped with synced hand-held tablets for real-time validation and farmer onboarding.")}</p>
                </div>
                <div className="pt-4 mt-4 flex items-center gap-1.5 text-secondary font-label-sm text-label-sm font-bold"><Icon name="sensors" className="text-[16px]" />{tYo(" Cluster Nodes Operational")}</div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-16 px-6 lg:px-12 bg-surface" id="inquiry-form">
          <div className="max-w-4xl mx-auto flex flex-col gap-8">
            <div className="text-center flex flex-col gap-2">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">{tYo("Formal Submission Desk")}</span>
              <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface">{tYo("Transmit Institutional Partnership Inquiry")}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xl mx-auto">{tYo("Direct institutional submissions are processed by CultivaNode’s Executive Directorate in Ibadan with official response SLAs within 48 business hours.")}</p>
            </div>
            <div className="bg-surface-container-lowest p-8 lg:p-10 rounded-2xl shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="institutionalInquiryForm" role="form">
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="font-label-md text-label-md text-on-surface">{tYo("Institution Name ")}<span className="text-error">*</span></label>
                  <input className="h-11 px-4 rounded-lg bg-surface text-on-surface placeholder:text-on-surface-variant/60 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" placeholder={tYo("e.g., Oyo State Ministry of Agriculture & Rural Development")} required type="text" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface">{tYo("Institution Category ")}<span className="text-error">*</span></label>
                  <select defaultValue="" className="h-11 px-4 rounded-lg bg-surface text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" required>
                    <option disabled value="">{tYo("Select institutional category")}</option>
                    <option value="state_gov">{tYo("State Government Ministry / ADP (OYSADEP, OGADEP, etc.)")}</option>
                    <option value="commercial_bank">{tYo("Commercial Bank / Ag-Lending Desk")}</option>
                    <option value="microfinance">{tYo("Microfinance Institution / Regional Credit Syndicate")}</option>
                    <option value="multilateral">{tYo("Multilateral Development Agency / NGO (WB, AFDB, IITA)")}</option>
                    <option value="industrial_offtaker">{tYo("Industrial Processor / Agro-Allied Miller")}</option>
                    <option value="research">{tYo("Seed Council / Federal Agronomic Research Center")}</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface">{tYo("Designated Representative ")}<span className="text-error">*</span></label>
                  <input className="h-11 px-4 rounded-lg bg-surface text-on-surface placeholder:text-on-surface-variant/60 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" placeholder={tYo("Full Name & Title (e.g. Dr. A. Adebayo, Dir. Extension)")} required type="text" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface">{tYo("Official Institutional Email ")}<span className="text-error">*</span></label>
                  <input className="h-11 px-4 rounded-lg bg-surface text-on-surface placeholder:text-on-surface-variant/60 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" placeholder={tYo("name@ministry.gov.ng or desk@bank.com")} required type="email" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface">{tYo("Direct Telephone Number ")}<span className="text-error">*</span></label>
                  <input className="h-11 px-4 rounded-lg bg-surface text-on-surface placeholder:text-on-surface-variant/60 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" placeholder="+234 (0) 803 000 0000" required type="tel" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface">{tYo("Geographic Area of Interest ")}<span className="text-error">*</span></label>
                  <select defaultValue="" className="h-11 px-4 rounded-lg bg-surface text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" required>
                    <option disabled value="">{tYo("Select regional cluster area")}</option>
                    <option value="oyo">{tYo("Oyo State (Ibadan, Saki, Ogbomoso, Iseyin Cassava Corridor)")}</option>
                    <option value="ogun">{tYo("Ogun State (Abeokuta, Ijebu, Sagamu Grain/Poultry Hub)")}</option>
                    <option value="osun">{tYo("Osun State (Osogbo, Ilesa, Ife Agro-forestry Belt)")}</option>
                    <option value="ondo">{tYo("Ondo State (Akure, Owo, Ondo Cocoa & Oil Palm Node)")}</option>
                    <option value="regional_multi">{tYo("Pan-South-West Multi-State Cluster Swarm")}</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="font-label-md text-label-md text-on-surface">{tYo("Proposed Collaboration Scope & Target Hectares / Volume")}</label>
                  <textarea className="px-4 py-3 rounded-lg bg-surface text-on-surface placeholder:text-on-surface-variant/60 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm resize-none" placeholder={tYo("Detail target crop cycles (cassava, maize, soybean, cocoa), anticipated budget or escrow throughput, extension officer count, and primary technical integration requirements...")} rows={4} />
                </div>
                <div className="flex items-start gap-3 md:col-span-2 bg-surface-container-low p-4 rounded-xl">
                  <input className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary" id="ndpaAck" required type="checkbox" />
                  <label className="font-label-sm text-label-sm text-on-surface-variant leading-snug" htmlFor="ndpaAck">{tYo("I acknowledge that institutional data sharing is regulated under the Nigeria Data Protection Act (NDPA 2023) and subject to Providus/Wema escrow clearing governance. All communications through this portal remain strictly confidential.")}</label>
                </div>
                <div className="md:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm"><Icon name="verified_user" className="text-secondary text-[18px]" />{tYo(" Encrypted via CultivaNode Gov-TLS Rails")}</div>
                  <button onClick={handleSubmit} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-all shadow-md font-label-lg text-label-lg font-semibold" type="submit"><Icon name="send" className="text-[20px]" />{tYo(" Transmit Institutional Inquiry")}</button>
                </div>
              </div>
              <div className={`${submitted ? "flex" : "hidden"} mt-6 p-6 rounded-xl bg-secondary-container text-on-secondary-container items-start gap-4`} id="formSuccessMessage">
                <Icon name="check_circle" className="text-[28px] text-secondary shrink-0" />
                <div className="flex flex-col gap-1">
                  <h4 className="font-headline-sm text-headline-sm font-bold">{tYo("Institutional Transmission Logged")}</h4>
                  <p className="font-body-sm text-body-sm">{tYo("Your Expression of Interest reference #CN-INS-2025-089 has been securely routed to the Strategic Partnerships Directorate. A formal protocol docket will be issued to your official email within 48 business hours.")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 px-6 lg:px-12 bg-surface-container-low">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-on-primary">
                <Icon name="corporate_fare" className="text-[24px]" />
              </div>
              <div>
                <h4 className="font-headline-sm text-headline-sm text-on-surface">{tYo("CultivaNode Institutional Headquarters")}</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Agrarian Innovation Hub, Agodi GRA, Ibadan, Oyo State, Nigeria")}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-on-surface font-label-md text-label-md">
              <a className="flex items-center gap-2 bg-surface-container-lowest px-4 py-2 rounded-lg shadow-sm hover:bg-surface-container transition-colors" href="mailto:institutions@cultivanode.ng"><Icon name="mail" className="text-secondary text-[18px]" />{tYo(" institutions@cultivanode.ng")}</a>
              <a className="flex items-center gap-2 bg-surface-container-lowest px-4 py-2 rounded-lg shadow-sm hover:bg-surface-container transition-colors" href="tel:+234202948200"><Icon name="phone" className="text-secondary text-[18px]" /> +234 (0) 202 948 200</a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
