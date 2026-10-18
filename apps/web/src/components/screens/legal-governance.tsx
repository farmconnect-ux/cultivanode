"use client";

// Ported from the "statutory_governance_legal_policies_cultivanode" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import { showScreenToast } from "@/components/ds/screen-dialog";
import type { ScreenProps } from "./types";
import { phrasebook } from "@/i18n/marketing";
import YO from "@/i18n/yo-marketing/legal-governance";

const tYo = phrasebook(YO);

export function LegalGovernance({ lang = "en" }: ScreenProps) {
  const [activeTab, setActiveTab] = useState<"privacy" | "terms" | "booking" | "dispute" | "sharing">("privacy");
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <aside aria-label={tYo("Regulatory Notice")} className="w-full bg-surface-container-high py-2.5 px-6 lg:px-12">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-on-surface-variant font-label-sm text-label-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span className="font-semibold text-on-surface">{tYo("STATUTORY INSTRUMENT 2023/NDPA-074:")}</span>
              <span>{tYo("Certified Annual Compliance Audit Filed with Nigeria Data Protection Commission (NDPC).")}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden md:inline-flex items-center gap-1.5 text-on-surface"><Icon name="verified" className="text-[16px] text-secondary" />{tYo(" NDPC ID: NDPC/APP/2024/0914-SW")}</span>
              <span className="text-outline-variant">|</span>
              <span className="text-on-surface">{tYo("CBN Escrow Clearing: Providus Bank Plc / Wema Bank Plc")}</span>
            </div>
          </div>
        </aside>
        <section className="w-full bg-surface px-6 lg:px-12 pt-8 pb-12">
          <div className="max-w-7xl mx-auto flex flex-col gap-8">
            <nav aria-label={tYo("Breadcrumbs")} className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant">
              <Link className="hover:text-primary transition-colors flex items-center gap-1" href={`/${lang}/legal`}><Icon name="account_balance" className="text-[16px]" />{tYo(" Legal Governance")}</Link>
              <span className="text-outline-variant">/</span>
              <span className="text-on-surface-variant">{tYo("Regulatory Framework & Statutory Trust")}</span>
              <span className="text-outline-variant">/</span>
              <span className="text-primary font-semibold">{tYo("Master Policies")}</span>
            </nav>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 flex flex-col gap-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container text-on-primary w-fit font-label-sm text-label-sm"><Icon name="shield_lock" className="text-[16px] text-secondary-fixed" />{tYo(" FEDERAL REPUBLIC OF NIGERIA • STATUTORY TRUST DIRECTORY")}</div>
                <h1 className="font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg font-bold text-primary tracking-tight leading-tight">{tYo("Statutory Governance, Trust Framework & Legal Policies")}</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">{tYo("CultivaNode operates under the strict legal tenets of the Nigeria Data Protection Act (NDPA 2023), Central Bank of Nigeria (CBN) financial escrow regulations, and peer-verified agricultural contracts across all nodes in the South-West Corridor.")}</p>
              </div>
              <div className="lg:col-span-4 bg-surface-container-low rounded-xl p-6 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">{tYo("Designated Custodian Rails")}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">{tYo("Live FedWire")}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="bg-surface-container-lowest p-3 rounded-lg flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                      <Icon name="account_balance" className="text-secondary text-[22px]" />
                      <div>
                        <div className="font-label-md text-label-md font-bold text-on-surface">{tYo("Providus Bank Plc")}</div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Designated Escrow Reserve #01248-NG")}</div>
                      </div>
                    </div>
                    <Icon name="verified" className="text-secondary text-[18px]" />
                  </div>
                  <div className="bg-surface-container-lowest p-3 rounded-lg flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                      <Icon name="payments" className="text-secondary text-[22px]" />
                      <div>
                        <div className="font-label-md text-label-md font-bold text-on-surface">{tYo("Wema Bank Plc / ALAT")}</div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Tractor Disbursement Rail #99401-NG")}</div>
                      </div>
                    </div>
                    <Icon name="verified" className="text-secondary text-[18px]" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 text-on-surface-variant font-label-sm text-label-sm">
                  <span>{tYo("Last Solvency Audit: 04 Mar 2025")}</span>
                  <span className="text-secondary font-semibold">{tYo("Tier-1 Guaranteed")}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary shrink-0">
                  <Icon name="gavel" className="text-[24px]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-label-md font-bold text-on-surface truncate">{tYo("NDPA 2023 Audited")}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{tYo("Full Farmer Data Autonomy")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary shrink-0">
                  <Icon name="account_balance_wallet" className="text-[24px]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-label-md font-bold text-on-surface truncate">{tYo("CBN Escrow Clearing")}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{tYo("Providus & Wema Custody")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary shrink-0">
                  <Icon name="fingerprint" className="text-[24px]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-label-md font-bold text-on-surface truncate">{tYo("NIMC NIN Verifications")}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{tYo("Level 0 to Tier 3 Identity")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary shrink-0">
                  <Icon name="percent" className="text-[24px]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-label-md font-bold text-on-surface truncate">{tYo("0% Pilot Commission")}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{tYo("Statutory Pilot Guarantee")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full bg-surface-container-low py-6 px-6 lg:px-12 shadow-xs">
          <div className="max-w-7xl mx-auto flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-label-lg text-label-lg uppercase tracking-wider text-primary font-bold">{tYo("Document Navigation (§4.19)")}</span>
                <span className="text-on-surface-variant font-label-sm text-label-sm">{tYo("• Select an active covenant")}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (typeof window !== "undefined") window.print();
                    showScreenToast(tYo.now("Printing legal covenants and statutory trust docket..."));
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-sm text-label-sm shadow-xs hover:bg-surface-container transition-colors"
                  id="btn-print-docket"
                  type="button"
                >
                  <Icon name="print" className="text-[16px]" />{tYo(" Print Entire Docket")}</button>
                <button
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                      navigator.clipboard.writeText("dpo@cultivanode.ng");
                    }
                    showScreenToast(tYo.now("DPO Registry email (dpo@cultivanode.ng) copied to clipboard."));
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-sm text-label-sm shadow-xs hover:bg-surface-container transition-colors"
                  id="btn-copy-dpo"
                  type="button"
                >
                  <Icon name="mail" className="text-[16px]" />{tYo(" Copy DPO Registry Contact")}</button>
              </div>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1" id="policy-tabs">
              <button
                onClick={() => {
                  setActiveTab("privacy");
                  showScreenToast(tYo.now("Viewing NDPA 2023 & Smallholder Farmer Privacy Covenant."));
                }}
                className={`tab-btn px-4 py-3 rounded-xl font-label-lg text-label-lg flex items-center gap-2.5 whitespace-nowrap transition-all ${
                  activeTab === "privacy"
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface shadow-xs"
                }`}
                data-tab="tab-privacy"
                type="button"
              >
                <Icon name="verified_user" className="text-[18px]" />
                <span>{tYo("NDPA 2023 & Farmer Privacy (/en/privacy)")}</span>
                {activeTab === "privacy" && <span className="w-2 h-2 rounded-full bg-secondary-fixed ml-1" />}
              </button>
              <button
                onClick={() => {
                  setActiveTab("terms");
                  showScreenToast(tYo.now("Viewing Master Terms & Mesh Usage Covenant."));
                }}
                className={`tab-btn px-4 py-3 rounded-xl font-label-lg text-label-lg flex items-center gap-2.5 whitespace-nowrap transition-all ${
                  activeTab === "terms"
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface shadow-xs"
                }`}
                data-tab="tab-terms"
                type="button"
              >
                <Icon name="contract" className="text-[18px]" />
                <span>{tYo("Master Terms & Mesh Usage (/en/terms)")}</span>
                {activeTab === "terms" && <span className="w-2 h-2 rounded-full bg-secondary-fixed ml-1" />}
              </button>
              <button
                onClick={() => {
                  setActiveTab("booking");
                  showScreenToast(tYo.now("Viewing Mechanization Escrow & Refunds Covenant."));
                }}
                className={`tab-btn px-4 py-3 rounded-xl font-label-lg text-label-lg flex items-center gap-2.5 whitespace-nowrap transition-all ${
                  activeTab === "booking"
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface shadow-xs"
                }`}
                data-tab="tab-booking"
                type="button"
              >
                <Icon name="agriculture" className="text-[18px]" />
                <span>{tYo("Mechanization Escrow & Refunds (/en/booking-policy)")}</span>
                {activeTab === "booking" && <span className="w-2 h-2 rounded-full bg-secondary-fixed ml-1" />}
              </button>
              <button
                onClick={() => {
                  setActiveTab("dispute");
                  showScreenToast(tYo.now("Viewing Proof-of-Work (PoW) & Arbitration Covenant."));
                }}
                className={`tab-btn px-4 py-3 rounded-xl font-label-lg text-label-lg flex items-center gap-2.5 whitespace-nowrap transition-all ${
                  activeTab === "dispute"
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface shadow-xs"
                }`}
                data-tab="tab-dispute"
                type="button"
              >
                <Icon name="balance" className="text-[18px]" />
                <span>{tYo("Proof-of-Work (PoW) & Arbitration (/en/dispute-policy)")}</span>
                {activeTab === "dispute" && <span className="w-2 h-2 rounded-full bg-secondary-fixed ml-1" />}
              </button>
              <button
                onClick={() => {
                  setActiveTab("sharing");
                  showScreenToast(tYo.now("Viewing Data Sharing & Institutional Registry Covenant."));
                }}
                className={`tab-btn px-4 py-3 rounded-xl font-label-lg text-label-lg flex items-center gap-2.5 whitespace-nowrap transition-all ${
                  activeTab === "sharing"
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface shadow-xs"
                }`}
                data-tab="tab-sharing"
                type="button"
              >
                <Icon name="hub" className="text-[18px]" />
                <span>{tYo("Data Sharing & Institutional Registry (/en/data-sharing)")}</span>
                {activeTab === "sharing" && <span className="w-2 h-2 rounded-full bg-secondary-fixed ml-1" />}
              </button>
            </div>
          </div>
        </section>
        <section className="w-full bg-surface px-6 lg:px-12 py-10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <aside aria-label={tYo("Legal Telemetry & Navigation")} className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-28">
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2 py-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-secondary mr-1.5" />{tYo(" Sovereign Field Clause")}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">{tYo("SEC-74-NG")}</span>
                </div>
                <div>
                  <div className="font-headline-sm text-headline-sm font-bold text-on-surface">{tYo("Non-Alienation Guarantee")}</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{tYo("Your farm boundaries (polygon GPS data) and harvest tonnage records are legally shielded from third-party price manipulators, land speculators, and commercial grain syndicates.")}</p>
                </div>
                <div className="bg-surface-container-low p-3.5 rounded-lg flex flex-col gap-2 text-on-surface">
                  <div className="flex justify-between items-center text-label-sm font-label-sm">
                    <span className="text-on-surface-variant">{tYo("Data Portability Engine:")}</span>
                    <span className="font-semibold text-secondary">{tYo("JSON / GeoTIFF / CSV")}</span>
                  </div>
                  <div className="flex justify-between items-center text-label-sm font-label-sm">
                    <span className="text-on-surface-variant">{tYo("Lender Revocation SLA:")}</span>
                    <span className="font-semibold text-primary">{tYo("Instant (0 Milliseconds)")}</span>
                  </div>
                  <div className="flex justify-between items-center text-label-sm font-label-sm">
                    <span className="text-on-surface-variant">{tYo("NDPC Audit Pass Rate:")}</span>
                    <span className="font-semibold text-secondary">{tYo("100% (Annual Clean)")}</span>
                  </div>
                </div>
                <a className="w-full py-2.5 px-3 rounded-lg bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary transition-colors" href="mailto:dpo@cultivanode.ng"><Icon name="contact_mail" className="text-[16px]" />{tYo(" Request Formal Data Erasure (DPO)")}</a>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="font-headline-sm text-headline-sm font-bold text-on-surface">{tYo("Mechanization Refund Calc")}</div>
                  <Icon name="calculate" className="text-secondary text-[20px]" />
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Clause 4 sets automated escrow return rates upon tractor booking dissolution:")}</p>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1" htmlFor="refund-hire-cost">{tYo("Simulated Booking Escrow (₦ NGN)")}</label>
                    <div className="bg-surface-container-low rounded-lg p-2 flex items-center justify-between">
                      <span className="font-label-md text-label-md font-bold text-on-surface">₦</span>
                      <input className="bg-transparent font-metric-num text-metric-num text-right font-bold text-primary w-full outline-none focus:outline-none" id="refund-hire-cost" type="number" defaultValue="120000" />
                    </div>
                  </div>
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1" htmlFor="refund-notice-time">{tYo("Notice Given Prior to Mobilization")}</label>
                    <select className="w-full bg-surface-container-low rounded-lg p-2.5 font-label-sm text-label-sm text-on-surface outline-none" id="refund-notice-time">
                      <option value="100">{tYo("> 48 Hours Notice (100% Refund)")}</option>
                      <option value="90">{tYo("24 – 48 Hours Notice (90% Refund)")}</option>
                      <option value="75">{tYo("< 24 Hours Notice (75% Refund - 25% Transit Fee)")}</option>
                      <option value="force">{tYo("Force Majeure / Mechanical Failure (100% Refund)")}</option>
                    </select>
                  </div>
                  <div className="bg-surface-container p-3 rounded-lg flex items-center justify-between mt-1">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Farmer Return:")}</span>
                      <span className="font-headline-md text-headline-md font-bold text-primary" id="refund-farmer-sum">₦120,000</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Tractor Operator:")}</span>
                      <span className="font-headline-md text-headline-md font-bold text-tertiary-container" id="refund-operator-sum">₦0</span>
                    </div>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant italic">{tYo("Settled automatically via Providus Escrow Clearing rails.")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-3">
                <div className="font-label-lg text-label-lg font-bold text-on-surface uppercase tracking-wider">{tYo("Statutory Verification Ladder")}</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded bg-surface-container-low text-on-surface">
                    <span className="font-label-sm text-label-sm font-semibold">{tYo("Tier 0 • Phone OTP")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("₦50,000 Max Daily")}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-surface-container-low text-on-surface">
                    <span className="font-label-sm text-label-sm font-semibold">{tYo("Tier 1 • NIN + Geo-Tag")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("₦500,000 / Booking")}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-surface-container-low text-on-surface">
                    <span className="font-label-sm text-label-sm font-semibold">{tYo("Tier 2 • BVN + Cooperative")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("₦2,500,000 Syndicate")}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-surface-container text-primary font-bold">
                    <span className="font-label-sm text-label-sm">{tYo("Tier 3 • CAC + Field Audit")}</span>
                    <span className="font-body-sm text-body-sm">{tYo("Unrestricted Industrial")}</span>
                  </div>
                </div>
              </div>
            </aside>
            <article aria-label={tYo("Legal Policy Articles")} className="lg:col-span-8 flex flex-col gap-8">
              <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">{tYo("DOCUMENT 74 • CLAUSE 1")}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">{tYo("NDPA 2023 / SEC 24(1)-(3)")}</span>
                </div>
                <div>
                  <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">{tYo("Clause 1: Data Sovereignty, Crop-Cycle Records & Absolute Farmer Ownership")}</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">{tYo("CultivaNode Infrastructure Ltd does not claim proprietary interest, IP rights, or operational ownership over any biometric identifiers, satellite cadastre boundaries, fertilizer schedules, or yield metrics created within this network. All agricultural production metrics remain the sovereign, exclusive asset of the registered landholder or certified tenant farmer.")}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-primary">
                      <Icon name="no_sim" className="text-[20px]" />
                      <span className="font-label-md text-label-md font-bold">{tYo("No Data Monetization")}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("CultivaNode is strictly prohibited from pooling, aggregating, or auctioning cadastral farm polygon data to international grain speculators or agrochemical cartels.")}</p>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-primary">
                      <Icon name="sync_saved_locally" className="text-[20px]" />
                      <span className="font-label-md text-label-md font-bold">{tYo("Right to Erasure & Portability")}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Under NDPA 2023 §34, every producer may immediately download their complete soil telemetry and harvest history, or order total cryptographic erasure of server storage.")}</p>
                  </div>
                </div>
                <div className="bg-surface-container-low p-4 rounded-xl flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                    <Icon name="shield_person" className="text-[20px]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-label-md text-label-md font-bold text-on-surface">{tYo("Designated Data Protection Officer (NDPC Registered)")}</span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Inquiries, right-to-be-forgotten petitions, and cooperative disclosures must be directed to our registered compliance desk at ")}<a className="text-primary font-semibold hover:underline" href="mailto:dpo@cultivanode.ng">{tYo("dpo@cultivanode.ng")}</a>{tYo(". Formal response SLA: Within 48 regulatory hours.")}</p>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-bold">{tYo("DOCUMENT 2 • CLAUSE 2")}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">{tYo("CBN ESCROW DIRECTIVE 2021/T1")}</span>
                </div>
                <div>
                  <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">{tYo("Clause 2: Central Bank of Nigeria (CBN) Partner Escrow Architecture & 0% Commission")}</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">{tYo("CultivaNode is an agricultural telematics and matchmaking software architecture. ")}<strong>{tYo("CultivaNode does not operate as an unlicensed financial institution, shadow deposit-taker, or unhedged digital wallet provider.")}</strong></p>
                </div>
                <div className="bg-surface-container-high p-5 rounded-xl flex flex-col gap-3">
                  <div className="font-label-md text-label-md font-bold text-on-surface flex items-center gap-2"><Icon name="security" className="text-secondary text-[20px]" />{tYo(" Custodian Bank Trust Separation")}</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Every tractor booking deposit, diesel mobilization fee, and grain off-take guarantee fund resides exclusively inside segregated omnibus escrow accounts established at ")}<strong>{tYo("Providus Bank Plc")}</strong>{tYo(" and ")}<strong>{tYo("Wema Bank Plc")}</strong>{tYo(". Funds never enter CultivaNode operational payroll or balance sheets. Disbursements are triggered solely upon automated GPS/IoT Proof-of-Work telemetry confirmations.")}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2">
                    <span className="font-label-md text-label-md font-bold text-on-surface">{tYo("0% Pilot Commission Policy")}</span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Codified under Section 4.12 of the Regional Pilot Charter: All cluster participants retain 100% of contract settlement value. No spread, maintenance fee, or arbitrary markup is deducted from tractor owners or smallholders during the current agrarian cycle.")}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2">
                    <span className="font-label-md text-label-md font-bold text-on-surface">{tYo("NIBSS Instant Settlement (NIP)")}</span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Release of escrow funds to machinery service providers upon geofenced job completion utilizes the Nigeria Inter-Bank Settlement System (NIBSS) protocol directly from Providus Escrow Rails with dual signatory validation.")}</p>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-bold">{tYo("DOCUMENT 2 • CLAUSE 3")}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">{tYo("KYC / AML REGULATIONS 2024")}</span>
                </div>
                <div>
                  <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">{tYo("Clause 3: 4-Tier Verification & Anti-Fraud Sanctions")}</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">{tYo("To defend farm clusters against land-cadastre spoofing, equipment theft, and phantom booking syndicates, participation is governed by strict identity verification steps.")}</p>
                </div>
                <div className="overflow-x-auto rounded-xl bg-surface-container-low">
                  <table className="w-full text-left">
                    <thead className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">{tYo("Tier & Name")}</th>
                        <th className="py-3 px-4">{tYo("Required Credentials")}</th>
                        <th className="py-3 px-4">{tYo("Escrow Cap")}</th>
                        <th className="py-3 px-4">{tYo("Enforcement Risk")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container font-body-sm text-body-sm text-on-surface">
                      <tr className="bg-surface-container-lowest">
                        <td className="py-3 px-4 font-bold text-primary">{tYo("Tier 0: Basic SMS")}</td>
                        <td className="py-3 px-4">{tYo("Nigerian MSISDN OTP verification")}</td>
                        <td className="py-3 px-4">{tYo("₦50,000 / day")}</td>
                        <td className="py-3 px-4 text-on-surface-variant">{tYo("Read-only cluster telemetry")}</td>
                      </tr>
                      <tr className="bg-surface-container-low">
                        <td className="py-3 px-4 font-bold text-primary">{tYo("Tier 1: Producer")}</td>
                        <td className="py-3 px-4">{tYo("NIMC NIN + Geotagged plot anchor")}</td>
                        <td className="py-3 px-4">{tYo("₦500,000 / hire")}</td>
                        <td className="py-3 px-4 text-on-surface-variant">{tYo("Plot validation required")}</td>
                      </tr>
                      <tr className="bg-surface-container-lowest">
                        <td className="py-3 px-4 font-bold text-primary">{tYo("Tier 2: Syndicate")}</td>
                        <td className="py-3 px-4">{tYo("Bank BVN + Registered Coop endorsement")}</td>
                        <td className="py-3 px-4">{tYo("₦2,500,000 / batch")}</td>
                        <td className="py-3 px-4 text-on-surface-variant">{tYo("Joint cooperative liability")}</td>
                      </tr>
                      <tr className="bg-surface-container-low">
                        <td className="py-3 px-4 font-bold text-primary">{tYo("Tier 3: Enterprise")}</td>
                        <td className="py-3 px-4">{tYo("CAC Registration + On-site Agronomist audit")}</td>
                        <td className="py-3 px-4">{tYo("Unlimited")}</td>
                        <td className="py-3 px-4 text-on-surface-variant">{tYo("Corporate bond & asset lien")}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="bg-surface-container-high p-4 rounded-xl flex items-center gap-3">
                  <Icon name="report_problem" className="text-error text-[24px] shrink-0" />
                  <p className="font-body-sm text-body-sm text-on-surface"><strong className="text-error font-semibold">{tYo("Statutory Penalty Notice:")}</strong>{tYo(" Uploading fabricated plot coordinates or submitting manipulated Proof-of-Work imagery triggers immediate account forfeiture, permanent BVN blacklisting via partner banks, and prosecution under Section 378 of the Nigerian Criminal Code Act.")}</p>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-bold">{tYo("DOCUMENT 2 • CLAUSE 4")}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">{tYo("TRACTOR SYNDICATE CODE §4.19")}</span>
                </div>
                <div>
                  <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">{tYo("Clause 4: Mechanization Booking Dissolution & Refund Schedule")}</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">{tYo("Industrial machinery relocation in South-West Nigeria involves fixed fuel mobilization costs and route planning. The following legally binding schedule applies to all tractor, harvester, and drone bookings executed on CultivaNode:")}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-surface-container-low p-5 rounded-xl flex flex-col justify-between gap-4">
                    <div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">{tYo("> 48 Hours Notice")}</span>
                      <div className="font-metric-num text-metric-num text-primary font-bold mt-2">{tYo("100% Refund")}</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">{tYo("Zero operator transit penalty")}</div>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Full escrow return credited within 60 minutes of farmer cancellation initiation.")}</p>
                  </div>
                  <div className="bg-surface-container-low p-5 rounded-xl flex flex-col justify-between gap-4">
                    <div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-label-sm text-label-sm font-bold">{tYo("24 – 48 Hours Notice")}</span>
                      <div className="font-metric-num text-metric-num text-on-surface font-bold mt-2">{tYo("90% Refund")}</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">{tYo("10% Operator fuel compensation")}</div>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Covers operator routing commitment and driver reservation fees.")}</p>
                  </div>
                  <div className="bg-surface-container-low p-5 rounded-xl flex flex-col justify-between gap-4">
                    <div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-label-sm text-label-sm font-bold">{tYo("< 24 Hours Notice")}</span>
                      <div className="font-metric-num text-metric-num text-tertiary font-bold mt-2">{tYo("75% Refund")}</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">{tYo("25% Operator deadhead transit fee")}</div>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Compensates operator for deadhead transit fuel consumed en-route to farm gate.")}</p>
                  </div>
                </div>
                <div className="bg-surface-container-high p-4 rounded-xl flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <Icon name="thunderstorm" className="text-primary text-[24px]" />
                    <span className="font-body-md text-body-md text-on-surface"><strong>{tYo("Force Majeure Protection:")}</strong>{tYo(" Torrential rainfall, flash flooding, or documented engine failure guarantees automatic free rescheduling or a 100% full refund with zero deductions.")}</span>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-bold">{tYo("DOCUMENT 2 • CLAUSE 5")}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">{tYo("ARBITRATION CODE ACT 2023")}</span>
                </div>
                <div>
                  <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">{tYo("Clause 5: Proof-of-Work (PoW) Telematics & 48-Hour Dispute Arbitration")}</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">{tYo("Escrow release is governed by objective technological validation rather than verbal assertions. Both mechanization contractors and hiring farmers enter a legally binding telematics framework upon task commencement.")}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-primary">
                      <Icon name="pin_drop" className="text-[20px]" />
                      <span className="font-label-md text-label-md font-bold">{tYo("GPS Geofencing")}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Equipment IoT beacons must register continuous operational pings strictly within the producer's cadastral parcel boundary.")}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-primary">
                      <Icon name="photo_camera" className="text-[20px]" />
                      <span className="font-label-md text-label-md font-bold">{tYo("Cryptographic EXIF")}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Post-plowing and harvest imagery must carry authentic time-stamped camera sensor EXIF hashes to prove genuine field completion.")}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-primary">
                      <Icon name="schedule" className="text-[20px]" />
                      <span className="font-label-md text-label-md font-bold">{tYo("48-Hr Dispute Window")}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Farmers have 48 hours to raise a quality objection. If contested, an independent certified cluster agronomist renders a final binding verdict.")}</p>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>
        <section className="w-full bg-surface-container-low px-6 lg:px-12 py-12">
          <div className="max-w-7xl mx-auto flex flex-col gap-8">
            <div>
              <div className="inline-flex items-center gap-2 font-label-sm text-label-sm font-bold text-secondary uppercase tracking-wider mb-1"><span className="w-2 h-2 rounded-full bg-secondary" />{tYo(" FEDERAL REGISTRY OF RECORDS & DOWNLOADS")}</div>
              <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl font-bold text-on-surface">{tYo("Statutory Incorporation & Compliance Certificates")}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mt-1">{tYo("CultivaNode provides open, verified access to our legal registration records and downloadable executed copies of master covenants for legal review by farm cooperatives.")}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-xs flex flex-col justify-between gap-6">
                <div className="flex flex-col gap-2">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">{tYo("Corporate Affairs Commission (CAC)")}</span>
                  <div className="font-headline-sm text-headline-sm font-bold text-on-surface">{tYo("CAC/RC/2023/1849103")}</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Incorporated under Companies and Allied Matters Act (CAMA 2020) as an Agrarian Telematics Infrastructure Provider.")}</p>
                </div>
                <div className="pt-4 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                  <span>{tYo("Incorporation Date: 14 Aug 2023")}</span>
                  <span className="text-secondary font-bold flex items-center gap-1"><Icon name="verified" className="text-[16px]" />{tYo(" Active")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-xs flex flex-col justify-between gap-6">
                <div className="flex flex-col gap-2">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">{tYo("Nigeria Data Protection Commission (NDPC)")}</span>
                  <div className="font-headline-sm text-headline-sm font-bold text-on-surface">{tYo("NDPC/APP/2024/0914-SW")}</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Registered Agricultural Data Controller of Major Importance (DCMI) under the Nigeria Data Protection Act 2023.")}</p>
                </div>
                <div className="pt-4 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                  <span>{tYo("Audit Expiry: 31 Dec 2025")}</span>
                  <span className="text-secondary font-bold flex items-center gap-1"><Icon name="verified" className="text-[16px]" />{tYo(" Audited")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-xs flex flex-col justify-between gap-6">
                <div className="flex flex-col gap-2">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">{tYo("CBN Regulated Partner Custodians")}</span>
                  <div className="font-headline-sm text-headline-sm font-bold text-on-surface">{tYo("Providus & Wema Bank")}</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Designated Agronomic Escrow Trustees operating under Central Bank of Nigeria Electronic Payments Regulations.")}</p>
                </div>
                <div className="pt-4 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                  <span>{tYo("Escrow Ratio: 100% Cash Backed")}</span>
                  <span className="text-secondary font-bold flex items-center gap-1"><Icon name="verified" className="text-[16px]" />{tYo(" Segregated")}</span>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm flex flex-col gap-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex flex-col">
                  <div className="font-headline-sm text-headline-sm font-bold text-on-surface">{tYo("Download Executable Statutory Documentation")}</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Authenticated PDF documents stamped with cryptographic signatures for offline cooperative review.")}</p>
                </div>
                <a className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md flex items-center gap-2 hover:bg-primary-container transition-colors shadow-xs" id="btn-download-all" href="/api/documents/legal-pack?download=1"><Icon name="download" className="text-[18px]" />{tYo(" Download Master Legal Bundle (.ZIP)")}</a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col justify-between gap-3">
                  <div className="flex items-start justify-between">
                    <Icon name="picture_as_pdf" className="text-primary text-[28px]" />
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">{tYo("1.4 MB")}</span>
                  </div>
                  <div>
                    <div className="font-label-md text-label-md font-bold text-on-surface">{tYo("NDPA 2023 Compliance & Privacy Charter")}</div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Document Ref: 74-NDPA-v3.1")}</div>
                  </div>
                  <a className="inline-flex items-center gap-1 text-primary font-label-sm text-label-sm font-semibold hover:underline" href="/api/documents/privacy-charter">{tYo("Read Charter ")}<Icon name="arrow_forward" className="text-[16px]" /></a>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col justify-between gap-3">
                  <div className="flex items-start justify-between">
                    <Icon name="picture_as_pdf" className="text-primary text-[28px]" />
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">{tYo("920 KB")}</span>
                  </div>
                  <div>
                    <div className="font-label-md text-label-md font-bold text-on-surface">{tYo("Master Terms & Mesh Conditions")}</div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Document Ref: 02-TOS-2025")}</div>
                  </div>
                  <Link className="inline-flex items-center gap-1 text-primary font-label-sm text-label-sm font-semibold hover:underline" href={`/${lang}/terms`}>{tYo("Read Terms ")}<Icon name="arrow_forward" className="text-[16px]" /></Link>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col justify-between gap-3">
                  <div className="flex items-start justify-between">
                    <Icon name="picture_as_pdf" className="text-primary text-[28px]" />
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">{tYo("1.1 MB")}</span>
                  </div>
                  <div>
                    <div className="font-label-md text-label-md font-bold text-on-surface">{tYo("Machinery Escrow & Cancellation Code")}</div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Document Ref: 02-ESC-§4.19")}</div>
                  </div>
                  <a className="inline-flex items-center gap-1 text-primary font-label-sm text-label-sm font-semibold hover:underline" href="/api/documents/escrow-rules">{tYo("Read Policy ")}<Icon name="arrow_forward" className="text-[16px]" /></a>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col justify-between gap-3">
                  <div className="flex items-start justify-between">
                    <Icon name="picture_as_pdf" className="text-primary text-[28px]" />
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">{tYo("810 KB")}</span>
                  </div>
                  <div>
                    <div className="font-label-md text-label-md font-bold text-on-surface">{tYo("Dispute Arbitration Framework")}</div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Document Ref: 02-ARB-48H")}</div>
                  </div>
                  <a className="inline-flex items-center gap-1 text-primary font-label-sm text-label-sm font-semibold hover:underline" href="/api/documents/dispute-procedure">{tYo("Read Policy ")}<Icon name="arrow_forward" className="text-[16px]" /></a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
