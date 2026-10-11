// Ported from the "verified_farm_record_credit_readiness_9.1_9.6" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";

export function CreditReadiness({ lang }: ScreenProps) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <div className="flex flex-col gap-space-lg mb-space-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-md">
            <div className="flex flex-col gap-space-xs max-w-3xl">
              <div className="flex items-center gap-space-sm">
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-semibold tracking-wide uppercase">Statutory §9.1 &amp; §9.6 Dossier</span>
                <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-semibold"><Icon name="lock" className="text-[14px]" /> Tamper-Evident SHA-256 Ledger</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight">Verified Farm Record &amp; Credit Readiness Hub</h1>
              <p className="font-body-md text-body-md text-on-surface-variant">Consent-governed cryptographic farm ledger, counterparty-corroborated harvest histories, and multi-tier creditworthiness underwriting dossier. Formalized for institutional agricultural lending without opaque algorithmic scoring.</p>
            </div>
            <div className="flex flex-wrap items-center gap-space-sm self-start lg:self-center">
              <button className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container-high transition-colors font-label-lg text-label-lg shadow-sm" type="button">
                <Icon name="verified_user" className="text-[18px] text-primary" />
                <span>Request Audit</span>
              </button>
              <button className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container-high transition-colors font-label-lg text-label-lg shadow-sm" type="button">
                <Icon name="vpn_key" className="text-[18px] text-tertiary" />
                <span>Manage Consent</span>
              </button>
              <button className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-primary-container text-on-primary hover:bg-primary transition-all font-label-lg text-label-lg shadow-sm" type="button">
                <Icon name="picture_as_pdf" className="text-[18px] text-primary-fixed" />
                <span>Download Underwriting Dossier</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
            <div className="flex items-center gap-space-sm p-space-md bg-surface-container-lowest rounded-lg shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-secondary-fixed/50 flex items-center justify-center shrink-0">
                <Icon name="verified" className="text-secondary text-[22px]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Data Privacy Protocol</span>
                <span className="font-label-lg text-label-lg font-semibold text-on-surface truncate">NDPA 2023 Consent-Controlled</span>
              </div>
            </div>
            <div className="flex items-center gap-space-sm p-space-md bg-surface-container-lowest rounded-lg shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-primary-fixed/40 flex items-center justify-center shrink-0">
                <Icon name="account_balance" className="text-primary text-[22px]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Regulatory Compliance</span>
                <span className="font-label-lg text-label-lg font-semibold text-on-surface truncate">CBN / NIRSAL Standard</span>
              </div>
            </div>
            <div className="flex items-center gap-space-sm p-space-md bg-surface-container-lowest rounded-lg shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-tertiary-fixed/60 flex items-center justify-center shrink-0">
                <Icon name="shield_with_heart" className="text-tertiary text-[22px]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Risk Architecture</span>
                <span className="font-label-lg text-label-lg font-semibold text-on-surface truncate">Leadway Multi-Peril Scored</span>
              </div>
            </div>
            <div className="flex items-center gap-space-sm p-space-md bg-surface-container-lowest rounded-lg shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                <Icon name="dataset" className="text-primary text-[22px]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Integrity Anchor</span>
                <span className="font-label-lg text-label-lg font-semibold text-on-surface truncate">SHA-256 Merkle Provenance</span>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-space-md mb-space-xl">
          <div className="xl:col-span-2 p-space-lg bg-surface-container-lowest rounded-lg shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Audit Integrity Level</span>
                <span className="font-headline-lg text-headline-lg text-primary mt-space-xs">94.2% Verified</span>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Class A Evidence</span>
            </div>
            <div className="my-space-md flex flex-col gap-space-xs">
              <div className="w-full bg-surface-container-low rounded-full h-2.5 overflow-hidden flex">
                <div className="bg-primary h-full" style={{ width: "78%" }} title="78% Counterparty Corroborated" />
                <div className="bg-secondary h-full" style={{ width: "16%" }} title="16% Document Verified" />
                <div className="bg-tertiary-fixed-dim h-full" style={{ width: "6%" }} title="6% Self-Reported" />
              </div>
              <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant pt-1">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" />78% Counterparty</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary inline-block" />16% Documented</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim inline-block" />6% Self-Log</span>
              </div>
            </div>
            <div className="pt-space-sm flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
              <span>Historical Dataset Size</span>
              <span className="font-semibold text-on-surface">318 Event Blocks</span>
            </div>
          </div>
          <div className="p-space-lg bg-surface-container-lowest rounded-lg shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Multi-Season History</span>
              <Icon name="calendar_month" className="text-[20px] text-primary" />
            </div>
            <div className="my-space-sm">
              <span className="font-metric-num text-metric-num text-on-surface block leading-none">4 Seasons</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 block">Consecutive cultivation cycles</span>
            </div>
            <div className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary">
              <Icon name="check_circle" className="text-[16px]" />
              <span>2024E → 2026E (Active)</span>
            </div>
          </div>
          <div className="p-space-lg bg-surface-container-lowest rounded-lg shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Verified Revenue</span>
              <Icon name="monetization_on" className="text-[20px] text-secondary" />
            </div>
            <div className="my-space-sm">
              <span className="font-metric-num text-metric-num text-on-surface block leading-none">₦62.45M</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 block">Reconciled cumulative sales</span>
            </div>
            <div className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary">
              <Icon name="account_balance_wallet" className="text-[16px]" />
              <span>100% Settled via Escrow</span>
            </div>
          </div>
          <div className="p-space-lg bg-surface-container-lowest rounded-lg shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Coverage Ratio (DSCR)</span>
              <Icon name="analytics" className="text-[20px] text-primary" />
            </div>
            <div className="my-space-sm">
              <span className="font-metric-num text-metric-num text-primary block leading-none">2.42x</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 block">Min. benchmark: 1.25x</span>
            </div>
            <div className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-semibold">
              <Icon name="trending_up" className="text-[16px]" />
              <span>High Repayment Margin</span>
            </div>
          </div>
          <div className="p-space-lg bg-primary-container text-on-primary rounded-lg shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="font-label-sm text-label-sm text-on-primary-container uppercase tracking-wider">Pre-Qualified Credit</span>
              <Icon name="verified" className="text-[20px] text-primary-fixed" />
            </div>
            <div className="my-space-sm">
              <span className="font-metric-num text-metric-num text-primary-fixed block leading-none">₦28.50M</span>
              <span className="font-body-sm text-body-sm text-on-primary-container mt-1 block">Max commercial line</span>
            </div>
            <div className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary-fixed">
              <Icon name="info" className="text-[16px]" />
              <span>Cash-flow asset matched</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-xl">
          <div className="lg:col-span-8 bg-surface-container-lowest rounded-lg p-space-lg shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-space-md mb-space-md">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Credit Readiness Index (§9.6)</span>
                  <div className="flex items-center gap-space-sm mt-0.5">
                    <span className="font-headline-lg text-headline-lg text-primary">Level 3 — Institutional Credit Ready</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> 5 of 6 Satisfied</span>
                  </div>
                </div>
                <div className="mt-2 sm:mt-0 text-left sm:text-right">
                  <span className="font-label-sm text-label-sm text-outline block">Evaluation Standard</span>
                  <span className="font-label-lg text-label-lg font-semibold text-on-surface">CBN Agri-Fin Standard V2.4</span>
                </div>
              </div>
              <div className="flex flex-col gap-space-sm">
                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                  <div className="flex items-start gap-space-sm">
                    <Icon name="verified" className="text-secondary text-[22px] mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg font-semibold text-on-surface">Cadastral Land Tenure &amp; Geofenced Boundary</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">42.5 Ha verified GPS polygon · Cadastral survey registry #OYO-ISE-2023-887 with Baale Attestation.</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-sm shrink-0 self-start sm:self-center">
                    <span className="px-2 py-0.5 rounded bg-secondary-fixed/70 text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Verified</span>
                    <button className="text-on-surface-variant hover:text-primary p-1" type="button">
                      <Icon name="attachment" className="text-[18px]" />
                    </button>
                  </div>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                  <div className="flex items-start gap-space-sm">
                    <Icon name="verified" className="text-secondary text-[22px] mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg font-semibold text-on-surface">3-Year Empirical Yield &amp; Weighbridge Corroboration</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Historical avg: Maize 4.2 MT/Ha, Cassava 22.8 MT/Ha. All supported by certified off-taker tickets.</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-sm shrink-0 self-start sm:self-center">
                    <span className="px-2 py-0.5 rounded bg-secondary-fixed/70 text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Verified</span>
                    <button className="text-on-surface-variant hover:text-primary p-1" type="button">
                      <Icon name="receipt_long" className="text-[18px]" />
                    </button>
                  </div>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                  <div className="flex items-start gap-space-sm">
                    <Icon name="verified" className="text-secondary text-[22px] mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg font-semibold text-on-surface">Double-Entry Ledger &amp; Settlement Reconciliation</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">CultivaNode Farm Books fully reconciled against Zenith Bank Commercial Statement (Account #...0914).</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-sm shrink-0 self-start sm:self-center">
                    <span className="px-2 py-0.5 rounded bg-secondary-fixed/70 text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Verified</span>
                    <button className="text-on-surface-variant hover:text-primary p-1" type="button">
                      <Icon name="sync_alt" className="text-[18px]" />
                    </button>
                  </div>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                  <div className="flex items-start gap-space-sm">
                    <Icon name="verified" className="text-secondary text-[22px] mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg font-semibold text-on-surface">CAMA 2020 Enforceable Offtake Contracts</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Tripartite escrow delivery history with Psaltry International &amp; Grand Cereals. Zero defaults recorded.</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-sm shrink-0 self-start sm:self-center">
                    <span className="px-2 py-0.5 rounded bg-secondary-fixed/70 text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Verified</span>
                    <button className="text-on-surface-variant hover:text-primary p-1" type="button">
                      <Icon name="gavel" className="text-[18px]" />
                    </button>
                  </div>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                  <div className="flex items-start gap-space-sm">
                    <Icon name="verified" className="text-secondary text-[22px] mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg font-semibold text-on-surface">Collateral &amp; Insurance Protection Structure</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Active Multi-Peril Policy #LWY-992 (Leadway Assurance) + Certified Warehouse Receipt #WR-2025-41 (85 MT).</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-sm shrink-0 self-start sm:self-center">
                    <span className="px-2 py-0.5 rounded bg-secondary-fixed/70 text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Active Policy</span>
                    <button className="text-on-surface-variant hover:text-primary p-1" type="button">
                      <Icon name="verified_user" className="text-[18px]" />
                    </button>
                  </div>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                  <div className="flex items-start gap-space-sm">
                    <Icon name="pending_actions" className="text-on-tertiary-container text-[22px] mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg font-semibold text-on-surface">2025 Audited Tax Clearance &amp; Joint Liability Sign-off</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Required to unlock Level 4 Prime Lending (Sub-9% Single Digit Interest Window).</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-sm shrink-0 self-start sm:self-center">
                    <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">Pending Action</span>
                    <button className="px-space-sm py-1 rounded bg-primary text-on-primary font-label-sm text-label-sm hover:bg-primary-container" type="button">Upload TCN</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-space-md p-space-sm bg-surface-container rounded-lg flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
              <span className="flex items-center gap-1.5"><Icon name="info" className="text-[16px] text-primary" /> Underwriting scores are completely transparent: Zero artificial algorithms or black-box rating penalties applied.</span>
              <Link className="font-label-sm text-label-sm font-semibold text-primary hover:underline" href={`/${lang}/legal`}>Read Audit Methodology</Link>
            </div>
          </div>
          <div className="lg:col-span-4 bg-surface-container-lowest rounded-lg p-space-lg shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Geospatial Validation</span>
                <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Cadastral Active</span>
              </div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface mb-space-sm">Iseyin Savanna Cluster Parcel</h2>
              <div className="w-full h-44 rounded-lg bg-cover bg-center relative overflow-hidden mb-space-md shadow-sm" data-location="Iseyin, Oyo State, Nigeria" style={{ backgroundImage: "url('/images/screens/659c2df88d78.webp')" }}>
                <div className="absolute inset-0 bg-primary/20" />
                <div className="absolute top-2 left-2 px-2 py-1 bg-surface/90 rounded text-on-surface font-label-sm text-label-sm backdrop-blur flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary" /> 42.5 Hectares Validated</div>
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-primary text-on-primary rounded font-label-sm text-label-sm shadow">GPS: 7.9625° N, 3.5936° E</div>
              </div>
              <div className="flex flex-col gap-space-xs text-body-sm font-body-sm">
                <div className="flex justify-between py-1 bg-surface-container-low px-space-sm rounded">
                  <span className="text-on-surface-variant">Survey Register ID</span>
                  <span className="font-semibold text-on-surface">OY/ISY/C-4428/2023</span>
                </div>
                <div className="flex justify-between py-1 px-space-sm">
                  <span className="text-on-surface-variant">Soil Organic Matter (SOM)</span>
                  <span className="font-semibold text-secondary">2.82% (Optimal Savanna)</span>
                </div>
                <div className="flex justify-between py-1 bg-surface-container-low px-space-sm rounded">
                  <span className="text-on-surface-variant">NDVI Remote Biomass</span>
                  <span className="font-semibold text-on-surface">0.78 (Sentinel-2 VHR)</span>
                </div>
                <div className="flex justify-between py-1 px-space-sm">
                  <span className="text-on-surface-variant">Leadway Insurance Policy</span>
                  <span className="font-semibold text-primary">#LWY-992-MPO (Fully Paid)</span>
                </div>
              </div>
            </div>
            <div className="mt-space-md pt-space-sm flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm text-label-sm">Supervising Agronomist</span>
              <span className="font-label-sm text-label-sm font-semibold text-on-surface">Q. Olapade (NIN: 7291...33)</span>
            </div>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm mb-space-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-sm mb-space-md">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Audit-Ready Empirical Farming History</span>
              <h2 className="font-headline-md text-headline-md text-primary">Multi-Season Production &amp; Settlement Ledger (§9.1)</h2>
            </div>
            <div className="flex items-center gap-space-xs">
              <button className="px-space-md py-1.5 rounded-lg bg-surface-container-low font-label-md text-label-md text-on-surface hover:bg-surface-container transition-colors flex items-center gap-1" type="button"><Icon name="filter_list" className="text-[16px]" /> Filter Seasons</button>
              <button className="px-space-md py-1.5 rounded-lg bg-surface-container-low font-label-md text-label-md text-on-surface hover:bg-surface-container transition-colors flex items-center gap-1" type="button"><Icon name="file_download" className="text-[16px]" /> Export CSV</button>
            </div>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                  <th className="py-space-sm px-space-md rounded-l">Season / Cycle</th>
                  <th className="py-space-sm px-space-md">Cultivated Crop &amp; Area</th>
                  <th className="py-space-sm px-space-md text-right">Harvest Yield</th>
                  <th className="py-space-sm px-space-md text-right">Gross Sales</th>
                  <th className="py-space-sm px-space-md text-right">Operating Cost</th>
                  <th className="py-space-sm px-space-md text-right">Net Margin</th>
                  <th className="py-space-sm px-space-md">Corroboration &amp; Ledger Proof</th>
                  <th className="py-space-sm px-space-md rounded-r text-center">NIN Audit</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm divide-y-0">
                <tr className="hover:bg-surface-container-low/60 transition-colors">
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg font-semibold text-on-surface">2024 Early Season</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Apr 2024 – Aug 2024</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-semibold text-on-surface">Maize (SAMMAZ-52)</span>
                      <span className="text-on-surface-variant">25.0 Hectares (Monocrop)</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <span className="font-semibold text-on-surface">108.5 MT</span>
                    <span className="block text-on-surface-variant text-[11px]">4.34 MT/Ha</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <span className="font-semibold text-primary">₦14,200,000</span>
                    <span className="block text-secondary text-[11px]">Grand Cereals Offtake</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <span className="text-on-surface">₦8,450,000</span>
                    <span className="block text-on-surface-variant text-[11px]">Input + Mechanization</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-secondary-fixed/50 font-label-md text-label-md text-on-secondary-fixed font-semibold">+40.5%</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="text-on-surface font-semibold text-[12px] flex items-center gap-1"><Icon name="link" className="text-secondary text-[14px]" /> Weighbridge #WB-491</span>
                      <span className="font-mono text-[10px] text-outline truncate max-w-[140px]" title="SHA256: 4a9fbc88921e01a88b">SHA: 4a9f...01a8</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-secondary-fixed text-on-secondary-fixed" title="Signed by Q. Olapade (NIN: 7291...33)">
                      <Icon name="done_all" className="text-[16px]" />
                    </span>
                  </td>
                </tr>
                <tr className="bg-surface-container-low/30 hover:bg-surface-container-low/60 transition-colors">
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg font-semibold text-on-surface">2024 Late Season</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Sep 2024 – Jan 2025</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-semibold text-on-surface">Soybean (TGX-14482E)</span>
                      <span className="text-on-surface-variant">20.0 Hectares</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <span className="font-semibold text-on-surface">44.0 MT</span>
                    <span className="block text-on-surface-variant text-[11px]">2.20 MT/Ha</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <span className="font-semibold text-primary">₦12,850,000</span>
                    <span className="block text-secondary text-[11px]">Direct Mill Delivery</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <span className="text-on-surface">₦7,100,000</span>
                    <span className="block text-on-surface-variant text-[11px]">Bio-Inoculants + Labor</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-secondary-fixed/50 font-label-md text-label-md text-on-secondary-fixed font-semibold">+44.7%</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="text-on-surface font-semibold text-[12px] flex items-center gap-1"><Icon name="link" className="text-secondary text-[14px]" /> Zenith Settlement #ZNT-812</span>
                      <span className="font-mono text-[10px] text-outline truncate max-w-[140px]" title="SHA256: d912ec910041abcf">SHA: d912...abcf</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-secondary-fixed text-on-secondary-fixed" title="Signed by Q. Olapade (NIN: 7291...33)">
                      <Icon name="done_all" className="text-[16px]" />
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low/60 transition-colors">
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg font-semibold text-on-surface">2025 Early Season</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Apr 2025 – Sep 2025</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-semibold text-on-surface">Cassava (TME-419)</span>
                      <span className="text-on-surface-variant">17.5 Hectares</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <span className="font-semibold text-on-surface">395.0 MT</span>
                    <span className="block text-on-surface-variant text-[11px]">22.57 MT/Ha</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <span className="font-semibold text-primary">₦18,900,000</span>
                    <span className="block text-secondary text-[11px]">Psaltry Factory Intake</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <span className="text-on-surface">₦10,120,000</span>
                    <span className="block text-on-surface-variant text-[11px]">Stem Cut + Harvester</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-secondary-fixed/50 font-label-md text-label-md text-on-secondary-fixed font-semibold">+46.5%</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="text-on-surface font-semibold text-[12px] flex items-center gap-1"><Icon name="link" className="text-secondary text-[14px]" /> Psaltry Ingest #PSI-901</span>
                      <span className="font-mono text-[10px] text-outline truncate max-w-[140px]" title="SHA256: e3c1a840902c5e">SHA: e3c1...2c5e</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-secondary-fixed text-on-secondary-fixed" title="Signed by Q. Olapade (NIN: 7291...33)">
                      <Icon name="done_all" className="text-[16px]" />
                    </span>
                  </td>
                </tr>
                <tr className="bg-surface-container-low/30 hover:bg-surface-container-low/60 transition-colors">
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg font-semibold text-on-surface">2025 Late Season</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Sep 2025 – Dec 2025</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-semibold text-on-surface">Maize (SC-510)</span>
                      <span className="text-on-surface-variant">25.0 Hectares</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <span className="font-semibold text-on-surface">112.0 MT</span>
                    <span className="block text-on-surface-variant text-[11px]">4.48 MT/Ha</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <span className="font-semibold text-primary">₦16,500,000</span>
                    <span className="block text-secondary text-[11px]">Commercial Feed Aggregator</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <span className="text-on-surface">₦9,200,000</span>
                    <span className="block text-on-surface-variant text-[11px]">Fertilizer + Combine Hire</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-secondary-fixed/50 font-label-md text-label-md text-on-secondary-fixed font-semibold">+44.2%</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="text-on-surface font-semibold text-[12px] flex items-center gap-1"><Icon name="link" className="text-secondary text-[14px]" /> Warehouse Rec #WR-2025</span>
                      <span className="font-mono text-[10px] text-outline truncate max-w-[140px]" title="SHA256: 8b093f0a12cf">SHA: 8b09...12cf</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-secondary-fixed text-on-secondary-fixed" title="Signed by Q. Olapade (NIN: 7291...33)">
                      <Icon name="done_all" className="text-[16px]" />
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-space-md pt-space-sm flex flex-col sm:flex-row sm:items-center sm:justify-between text-body-sm font-body-sm text-on-surface-variant gap-space-sm">
            <div className="flex items-center gap-space-sm">
              <Icon name="verified" className="text-secondary text-[18px]" />
              <span>All 4 cycles possess counterparty bank reconciliation slips confirmed via NIBSS Settlement API.</span>
            </div>
            <div className="flex items-center gap-space-md font-label-md text-label-md">
              <span>Weighted Margin: <strong className="text-primary font-bold">43.8%</strong></span>
              <span>Average Annual Revenue: <strong className="text-primary font-bold">₦31.22M</strong></span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-xl">
          <div className="lg:col-span-6 bg-surface-container-lowest rounded-lg p-space-lg shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Data Provenance Architecture</span>
                <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold">Tiered Quality Matrix (§9.1)</span>
              </div>
              <h2 className="font-headline-md text-headline-md text-primary mb-space-md">Two-Tier Underwriting Quality Breakdown</h2>
              <div className="flex flex-col gap-space-md">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-label-md font-label-md">
                    <span className="font-semibold text-on-surface flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" /> Level 4: Independently Verified (Field GPS &amp; Satellite)</span>
                    <span className="text-primary font-bold">24% of Data</span>
                  </div>
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: "24%" }} />
                  </div>
                  <span className="text-body-sm font-body-sm text-on-surface-variant">Cadastral perimeter polygon walkthrough, drone multispectral, Sentinel-2 NDVI canopy index.</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-label-md font-label-md">
                    <span className="font-semibold text-on-surface flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-secondary inline-block" /> Level 3: Counterparty Corroborated (Off-takers &amp; Escrow)</span>
                    <span className="text-secondary font-bold">54% of Data</span>
                  </div>
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div className="bg-secondary h-full" style={{ width: "54%" }} />
                  </div>
                  <span className="text-body-sm font-body-sm text-on-surface-variant">Weighbridge intake receipts, FMCG inspection certificates, Zenith Bank escrow settlement records.</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-label-md font-label-md">
                    <span className="font-semibold text-on-surface flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary-fixed-dim inline-block" /> Level 2: Document-Supported (Invoices &amp; Waybills)</span>
                    <span className="text-on-surface font-bold">16% of Data</span>
                  </div>
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div className="bg-primary-fixed-dim h-full" style={{ width: "16%" }} />
                  </div>
                  <span className="text-body-sm font-body-sm text-on-surface-variant">Certified seed purchase slips, agro-dealer fertilizer requisition vouchers, tractor operator logs.</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-label-md font-label-md">
                    <span className="font-semibold text-on-surface flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-tertiary-fixed-dim inline-block" /> Level 1: Farmer Self-Reported (Uncorroborated)</span>
                    <span className="text-tertiary-container font-bold">6% of Data</span>
                  </div>
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div className="bg-tertiary-fixed-dim h-full" style={{ width: "6%" }} />
                  </div>
                  <span className="text-body-sm font-body-sm text-on-surface-variant">Manual scouting logs, daily casual labor attendance tallies, minor miscellaneous cash petty cash.</span>
                </div>
              </div>
            </div>
            <div className="mt-space-md p-space-sm bg-surface-container-low rounded-lg text-body-sm font-body-sm text-on-surface-variant"><strong className="text-on-surface">Underwriting Confidence:</strong> 78% of all underwriting points possess external cryptographic counterparty proof, comfortably surpassing the 60% minimum threshold for commercial microfinance syndication.</div>
          </div>
          <div className="lg:col-span-6 bg-surface-container-lowest rounded-lg p-space-lg shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Expertise &amp; Soil Ecology</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-semibold"><Icon name="shield" className="text-[14px]" /> Certified Sign-off</span>
              </div>
              <h2 className="font-headline-md text-headline-md text-primary mb-space-md">Lead Agronomist Attestation (§9.6)</h2>
              <div className="p-space-md rounded-lg bg-surface-container-low mb-space-md flex items-center justify-between">
                <div className="flex items-center gap-space-md">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold">QO</div>
                  <div className="flex flex-col">
                    <span className="font-label-lg text-label-lg font-semibold text-on-surface">Quadri Olapade, M.Sc. Agronomy</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Lead Agronomist &amp; Chartered Extension Specialist</span>
                    <span className="font-mono text-[11px] text-outline">NIN: 7291-8834-9012 · COREN Reg #A-4182</span>
                  </div>
                </div>
                <div className="hidden sm:flex flex-col text-right">
                  <span className="font-label-sm text-label-sm text-secondary font-semibold">Attestation Valid</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Signed: 12 Jan 2026</span>
                </div>
              </div>
              <div className="space-y-space-sm font-body-sm text-body-sm text-on-surface-variant">
                <div className="p-space-sm bg-surface-container-low rounded-lg">
                  <strong className="text-on-surface block font-label-md text-label-md mb-0.5">Soil Quality &amp; Heavy Metals Screen</strong>
                  <span>Derived savanna loam with pH 6.4 (neutral-optimal), 2.8% Organic Matter, and zero toxic heavy metal residue detected in composite lab test (#IITA-OYS-2025-09).</span>
                </div>
                <div className="p-space-sm bg-surface-container-low rounded-lg">
                  <strong className="text-on-surface block font-label-md text-label-md mb-0.5">Off-take Escrow Discharge Reliability</strong>
                  <span>100% timely delivery record across 6 consecutive forward contracts. Zero contract cancellations, zero quality rejections at factory gate weighbridges.</span>
                </div>
                <div className="p-space-sm bg-surface-container-low rounded-lg">
                  <strong className="text-on-surface block font-label-md text-label-md mb-0.5">Agronomic Risk Rating</strong>
                  <span>Low pest pressure vulnerability; synchronized with Oyo State Agricultural Development Programme (OYSADEP) early warning advisory network.</span>
                </div>
              </div>
            </div>
            <div className="mt-space-md pt-space-sm flex items-center justify-between text-body-sm font-body-sm">
              <span className="text-on-surface-variant">Ledger Signature: <code className="font-mono text-[11px] text-primary">0x9b4f...8a22d</code></span>
              <button className="font-label-sm text-label-sm font-semibold text-primary hover:underline flex items-center gap-1" type="button"><Icon name="history_edu" className="text-[14px]" /> View Full Agronomic Memo</button>
            </div>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm mb-space-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-sm pb-space-md mb-space-md">
            <div className="flex flex-col">
              <div className="flex items-center gap-space-sm">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Granular NDPA 2023 Controls</span>
                <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Farmer Sovereign Consent</span>
              </div>
              <h2 className="font-headline-md text-headline-md text-primary mt-0.5">Consent &amp; Institutional Data-Sharing Authorization (§9.1)</h2>
            </div>
            <div className="flex items-center gap-space-xs">
              <span className="text-body-sm font-body-sm text-on-surface-variant">Active External Consents: <strong className="text-on-surface">2</strong></span>
              <button className="px-space-md py-1.5 rounded-lg bg-surface-container-low font-label-md text-label-md text-on-surface hover:bg-surface-container transition-colors flex items-center gap-1" type="button"><Icon name="history" className="text-[16px]" /> Complete Audit Trail</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md mb-space-md">
            <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-lg text-label-lg font-semibold text-on-surface">Sterling Bank Agri-Finance</span>
                  <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Active</span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant block mb-space-sm">Purpose: Working Capital Loan Requisition (₦15.0M facility)</span>
                <div className="flex flex-col gap-1 text-label-sm font-label-sm text-on-surface-variant bg-surface-container-lowest p-space-sm rounded">
                  <div className="flex justify-between">
                    <span>Authorized Scope:</span>
                    <span className="font-semibold text-on-surface">4-Season Production &amp; Bank Logs</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Timeframe:</span>
                    <span className="text-primary font-semibold">Expires in 18 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Access Type:</span>
                    <span className="text-on-surface font-semibold">Read-Only (PDF + API)</span>
                  </div>
                </div>
              </div>
              <div className="mt-space-md pt-space-sm flex items-center justify-between">
                <button className="font-label-sm text-label-sm font-semibold text-error hover:underline flex items-center gap-1" type="button"><Icon name="block" className="text-[14px]" /> Revoke Access</button>
                <button className="font-label-sm text-label-sm font-semibold text-primary hover:underline" type="button">View Pull Logs (4)</button>
              </div>
            </div>
            <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-lg text-label-lg font-semibold text-on-surface">Leadway Assurance Agro-Desk</span>
                  <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Active</span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant block mb-space-sm">Purpose: Multi-Peril Index Cover (#LWY-992 Underwriting)</span>
                <div className="flex flex-col gap-1 text-label-sm font-label-sm text-on-surface-variant bg-surface-container-lowest p-space-sm rounded">
                  <div className="flex justify-between">
                    <span>Authorized Scope:</span>
                    <span className="font-semibold text-on-surface">GPS Parcels, Weather &amp; Loss Logs</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Timeframe:</span>
                    <span className="text-primary font-semibold">Seasonal (Until Aug 2026)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Access Type:</span>
                    <span className="text-on-surface font-semibold">Continuous Telemetry</span>
                  </div>
                </div>
              </div>
              <div className="mt-space-md pt-space-sm flex items-center justify-between">
                <button className="font-label-sm text-label-sm font-semibold text-primary hover:underline flex items-center gap-1" type="button"><Icon name="tune" className="text-[14px]" /> Modify Scope</button>
                <button className="font-label-sm text-label-sm font-semibold text-primary hover:underline" type="button">View Pull Logs (12)</button>
              </div>
            </div>
            <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-lg text-label-lg font-semibold text-on-surface">NIRSAL Microfinance Bank</span>
                  <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">Pending Request</span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant block mb-space-sm">Purpose: Tractor Mechanization Asset Finance (₦8.5M Requisition)</span>
                <div className="flex flex-col gap-1 text-label-sm font-label-sm text-on-surface-variant bg-surface-container-lowest p-space-sm rounded">
                  <div className="flex justify-between">
                    <span>Requested Scope:</span>
                    <span className="font-semibold text-on-surface">Equipment Proof-of-Work Logs</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Request Date:</span>
                    <span className="text-outline font-semibold">Today, 08:30 AM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Originating Desk:</span>
                    <span className="text-on-surface font-semibold">Ibadan Regional Credit Desk</span>
                  </div>
                </div>
              </div>
              <div className="mt-space-md pt-space-sm flex items-center justify-between gap-space-xs">
                <button className="px-space-sm py-1 rounded bg-surface-container text-on-surface-variant hover:text-error font-label-sm text-label-sm" type="button">Decline</button>
                <button className="px-space-md py-1 rounded bg-primary text-on-primary font-label-sm text-label-sm hover:bg-primary-container transition-colors" type="button">Approve Access</button>
              </div>
            </div>
          </div>
          <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
            <div className="flex items-start gap-space-sm">
              <Icon name="verified_user" className="text-secondary text-[24px] mt-0.5" />
              <div className="flex flex-col">
                <span className="font-label-md text-label-md font-semibold text-on-surface">Nigeria Data Protection Act (NDPA) 2023 Enforcement Notice</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant max-w-4xl">You maintain unconstrained ownership of your agronomy logs and financial records. Every query executed by commercial banks or insurers creates an immutable SHA-256 ledger record. You can instantly revoke or edit any institution’s access privileges at zero financial penalty.</p>
              </div>
            </div>
            <div className="shrink-0 self-start sm:self-center">
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-secondary font-semibold bg-surface-container-lowest px-2 py-1 rounded"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Ledger Synced: 2026-03-29</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
