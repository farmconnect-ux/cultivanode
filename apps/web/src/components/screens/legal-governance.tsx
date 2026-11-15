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
        <aside aria-label={tYo("Policy Notice")} className="w-full bg-surface-container-high py-2.5 px-6 lg:px-12">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-on-surface-variant font-label-sm text-label-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span className="font-semibold text-on-surface">{tYo("DRAFT POLICIES:")}</span>
              <span>{tYo("These legal documents are drafts under review.")}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden md:inline-flex items-center gap-1.5 text-on-surface"><Icon name="account_balance" className="text-[16px] text-secondary" />{tYo(" Excel Palace Global Concept (BN 7455859)")}</span>
              <span className="text-outline-variant">|</span>
              <span className="text-on-surface">{tYo("Escrow partner: not signed yet")}</span>
            </div>
          </div>
        </aside>
        <section className="w-full bg-surface px-6 lg:px-12 pt-8 pb-12">
          <div className="max-w-7xl mx-auto flex flex-col gap-8">
            <nav aria-label={tYo("Breadcrumbs")} className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant">
              <Link className="hover:text-primary transition-colors flex items-center gap-1" href={`/${lang}/legal`}><Icon name="account_balance" className="text-[16px]" />{tYo(" Legal Governance")}</Link>
              <span className="text-outline-variant">/</span>
              <span className="text-on-surface-variant">{tYo("Policies")}</span>
              <span className="text-outline-variant">/</span>
              <span className="text-primary font-semibold">{tYo("Draft Policies")}</span>
            </nav>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 flex flex-col gap-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container text-on-primary w-fit font-label-sm text-label-sm"><Icon name="shield_lock" className="text-[16px] text-secondary-fixed" />{tYo(" DRAFTS UNDER REVIEW")}</div>
                <h1 className="font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg font-bold text-primary tracking-tight leading-tight">{tYo("Legal Policies & How We Work")}</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">{tYo("These policies are drafts under review. We follow the Nigeria Data Protection Act 2023. When you hire in the pilot, you pay the tractor owner or farm hand directly. Escrow is coming once a licensed payment partner is signed.")}</p>
              </div>
              <div className="lg:col-span-4 bg-surface-container-low rounded-xl p-6 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">{tYo("Escrow Partner")}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">{tYo("Not signed yet")}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="bg-surface-container-lowest p-3 rounded-lg flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                      <Icon name="account_balance" className="text-secondary text-[22px]" />
                      <div>
                        <div className="font-label-md text-label-md font-bold text-on-surface">{tYo("Licensed payment partner")}</div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">{tYo("We will name the partner here once the agreement is signed.")}</div>
                      </div>
                    </div>
                    <Icon name="schedule" className="text-secondary text-[18px]" />
                  </div>
                  <div className="bg-surface-container-lowest p-3 rounded-lg flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                      <Icon name="payments" className="text-secondary text-[22px]" />
                      <div>
                        <div className="font-label-md text-label-md font-bold text-on-surface">{tYo("In the pilot today")}</div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">{tYo("You pay the provider directly")}</div>
                      </div>
                    </div>
                    <Icon name="verified" className="text-secondary text-[18px]" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 text-on-surface-variant font-label-sm text-label-sm">
                  <span>{tYo("No escrow funds held yet")}</span>
                  <span className="text-secondary font-semibold">{tYo("Coming soon")}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary shrink-0">
                  <Icon name="gavel" className="text-[24px]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-label-md font-bold text-on-surface truncate">{tYo("We Follow NDPA 2023")}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{tYo("Consent before ID checks")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary shrink-0">
                  <Icon name="account_balance_wallet" className="text-[24px]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-label-md font-bold text-on-surface truncate">{tYo("Escrow")}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{tYo("Coming soon")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary shrink-0">
                  <Icon name="fingerprint" className="text-[24px]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-label-md font-bold text-on-surface truncate">{tYo("ID Checks")}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{tYo("NIN, BVN and bank account")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary shrink-0">
                  <Icon name="percent" className="text-[24px]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-label-md font-bold text-on-surface truncate">{tYo("No Fee on Hires")}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{tYo("During the pilot")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full bg-surface-container-low py-6 px-6 lg:px-12 shadow-xs">
          <div className="max-w-7xl mx-auto flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-label-lg text-label-lg uppercase tracking-wider text-primary font-bold">{tYo("Document Navigation")}</span>
                <span className="text-on-surface-variant font-label-sm text-label-sm">{tYo("• Select a draft policy")}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (typeof window !== "undefined") window.print();
                    showScreenToast(tYo.now("Printing draft policies..."));
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-sm text-label-sm shadow-xs hover:bg-surface-container transition-colors"
                  id="btn-print-docket"
                  type="button"
                >
                  <Icon name="print" className="text-[16px]" />{tYo(" Print All Policies")}</button>
                <button
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                      navigator.clipboard.writeText(`${window.location.origin}/${lang}/contact`);
                    }
                    showScreenToast(tYo.now("Contact page link copied. A data protection contact will be named here once appointed."));
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-sm text-label-sm shadow-xs hover:bg-surface-container transition-colors"
                  id="btn-copy-dpo"
                  type="button"
                >
                  <Icon name="mail" className="text-[16px]" />{tYo(" Copy Contact Page Link")}</button>
              </div>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1" id="policy-tabs">
              <button
                onClick={() => {
                  setActiveTab("privacy");
                  showScreenToast(tYo.now("Viewing the draft privacy policy."));
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
                <span>{tYo("Privacy")}</span>
                {activeTab === "privacy" && <span className="w-2 h-2 rounded-full bg-secondary-fixed ml-1" />}
              </button>
              <button
                onClick={() => {
                  setActiveTab("terms");
                  showScreenToast(tYo.now("Viewing the draft terms of use."));
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
                <span>{tYo("Terms of Use")}</span>
                {activeTab === "terms" && <span className="w-2 h-2 rounded-full bg-secondary-fixed ml-1" />}
              </button>
              <button
                onClick={() => {
                  setActiveTab("booking");
                  showScreenToast(tYo.now("Viewing the draft bookings and refunds policy."));
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
                <span>{tYo("Bookings & Refunds")}</span>
                {activeTab === "booking" && <span className="w-2 h-2 rounded-full bg-secondary-fixed ml-1" />}
              </button>
              <button
                onClick={() => {
                  setActiveTab("dispute");
                  showScreenToast(tYo.now("Viewing the draft disputes policy."));
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
                <span>{tYo("Proof of Work & Disputes")}</span>
                {activeTab === "dispute" && <span className="w-2 h-2 rounded-full bg-secondary-fixed ml-1" />}
              </button>
              <button
                onClick={() => {
                  setActiveTab("sharing");
                  showScreenToast(tYo.now("Viewing the draft data sharing policy."));
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
                <span>{tYo("Data Sharing")}</span>
                {activeTab === "sharing" && <span className="w-2 h-2 rounded-full bg-secondary-fixed ml-1" />}
              </button>
            </div>
          </div>
        </section>
        <section className="w-full bg-surface px-6 lg:px-12 py-10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <aside aria-label={tYo("Policy Summary")} className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-28">
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2 py-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-secondary mr-1.5" />{tYo(" Your Data")}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">{tYo("DRAFT")}</span>
                </div>
                <div>
                  <div className="font-headline-sm text-headline-sm font-bold text-on-surface">{tYo("Your Data Stays Yours")}</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{tYo("Your farm locations and harvest records belong to you. We do not sell them to traders, land buyers or anyone else.")}</p>
                </div>
                <div className="bg-surface-container-low p-3.5 rounded-lg flex flex-col gap-2 text-on-surface">
                  <div className="flex justify-between items-center text-label-sm font-label-sm">
                    <span className="text-on-surface-variant">{tYo("Download your data:")}</span>
                    <span className="font-semibold text-secondary">{tYo("On request")}</span>
                  </div>
                  <div className="flex justify-between items-center text-label-sm font-label-sm">
                    <span className="text-on-surface-variant">{tYo("Delete your data:")}</span>
                    <span className="font-semibold text-primary">{tYo("On request")}</span>
                  </div>
                  <div className="flex justify-between items-center text-label-sm font-label-sm">
                    <span className="text-on-surface-variant">{tYo("ID numbers stored:")}</span>
                    <span className="font-semibold text-secondary">{tYo("Masked only")}</span>
                  </div>
                </div>
                <Link className="w-full py-2.5 px-3 rounded-lg bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary transition-colors" href={`/${lang}/contact`}><Icon name="contact_mail" className="text-[16px]" />{tYo(" Ask to Download or Delete Your Data")}</Link>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="font-headline-sm text-headline-sm font-bold text-on-surface">{tYo("Refund Example (Planned)")}</div>
                  <Icon name="calculate" className="text-secondary text-[20px]" />
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Draft refund rates for when escrow is live. In the pilot today you pay the provider directly, so agree cancellations with them.")}</p>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1" htmlFor="refund-hire-cost">{tYo("Example Booking Amount (₦ NGN)")}</label>
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
                  <span className="font-body-sm text-body-sm text-on-surface-variant italic">{tYo("Example only. Escrow is not live yet.")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-3">
                <div className="font-label-lg text-label-lg font-bold text-on-surface uppercase tracking-wider">{tYo("ID Checks")}</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded bg-surface-container-low text-on-surface">
                    <span className="font-label-sm text-label-sm font-semibold">{tYo("Sign in • Email")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Everyone")}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-surface-container-low text-on-surface">
                    <span className="font-label-sm text-label-sm font-semibold">{tYo("NIN check")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Listers & payees")}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-surface-container-low text-on-surface">
                    <span className="font-label-sm text-label-sm font-semibold">{tYo("BVN check")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Listers & payees")}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-surface-container text-primary font-bold">
                    <span className="font-label-sm text-label-sm">{tYo("Bank account check")}</span>
                    <span className="font-body-sm text-body-sm">{tYo("Listers & payees")}</span>
                  </div>
                </div>
              </div>
            </aside>
            <article aria-label={tYo("Legal Policy Articles")} className="lg:col-span-8 flex flex-col gap-8">
              <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">{tYo("DRAFT • CLAUSE 1")}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">{tYo("NDPA 2023")}</span>
                </div>
                <div>
                  <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">{tYo("Clause 1: Your Data Belongs to You")}</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">{tYo("Excel Palace Global Concept (BN 7455859), which runs CultivaNode, does not claim ownership of your farm locations, farm records, fertiliser plans or harvest records. They belong to you.")}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-primary">
                      <Icon name="no_sim" className="text-[20px]" />
                      <span className="font-label-md text-label-md font-bold">{tYo("No Selling of Data")}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("We do not sell or rent your farm data to traders, agrochemical companies or anyone else.")}</p>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-primary">
                      <Icon name="sync_saved_locally" className="text-[20px]" />
                      <span className="font-label-md text-label-md font-bold">{tYo("Right to Erasure & Portability")}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Under the Nigeria Data Protection Act 2023 you can ask to download your data or to have it deleted.")}</p>
                  </div>
                </div>
                <div className="bg-surface-container-low p-4 rounded-xl flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                    <Icon name="shield_person" className="text-[20px]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-label-md text-label-md font-bold text-on-surface">{tYo("Data Protection Contact")}</span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("A data protection contact is not appointed yet. Until then, send data requests through our ")}<Link className="text-primary font-semibold hover:underline" href={`/${lang}/contact`}>{tYo("contact page")}</Link>{tYo(" and say it is a data request.")}</p>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-bold">{tYo("DRAFT • CLAUSE 2")}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">{tYo("PAYMENTS")}</span>
                </div>
                <div>
                  <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">{tYo("Clause 2: Payments, Escrow (Coming Soon) & No Fee on Hires")}</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">{tYo("CultivaNode is software that connects farmers with machinery owners and farm hands. ")}<strong>{tYo("CultivaNode does not hold your money.")}</strong></p>
                </div>
                <div className="bg-surface-container-high p-5 rounded-xl flex flex-col gap-3">
                  <div className="font-label-md text-label-md font-bold text-on-surface flex items-center gap-2"><Icon name="security" className="text-secondary text-[20px]" />{tYo(" Escrow (Coming Soon)")}</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("When you hire in the pilot, you pay the tractor owner or farm hand directly. ")}<strong>{tYo("Escrow (money held until you confirm the job)")}</strong>{tYo(" is coming once a licensed payment partner is signed. We will name the partner here once the agreement is signed.")}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2">
                    <span className="font-label-md text-label-md font-bold text-on-surface">{tYo("No Platform Fee on Hires")}</span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("There is no platform fee on hires during the pilot. Farmers pay providers directly, and providers keep the full amount.")}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2">
                    <span className="font-label-md text-label-md font-bold text-on-surface">{tYo("Marketplace Payments")}</span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Marketplace buyers pay at checkout by card, bank transfer or USSD through a licensed payment provider.")}</p>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-bold">{tYo("DRAFT • CLAUSE 3")}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">{tYo("ID CHECKS")}</span>
                </div>
                <div>
                  <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">{tYo("Clause 3: ID Checks & Fraud")}</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">{tYo("To protect farmers and providers from fraud, everyone who lists equipment or receives payments is checked with their NIN, BVN and bank account, through a licensed verification provider, after giving consent.")}</p>
                </div>
                <div className="overflow-x-auto rounded-xl bg-surface-container-low">
                  <table className="w-full text-left">
                    <thead className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">{tYo("Who")}</th>
                        <th className="py-3 px-4">{tYo("What We Check")}</th>
                        <th className="py-3 px-4">{tYo("When")}</th>
                        <th className="py-3 px-4">{tYo("Notes")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container font-body-sm text-body-sm text-on-surface">
                      <tr className="bg-surface-container-lowest">
                        <td className="py-3 px-4 font-bold text-primary">{tYo("Everyone")}</td>
                        <td className="py-3 px-4">{tYo("Email sign-in (phone sign-in coming soon)")}</td>
                        <td className="py-3 px-4">{tYo("At sign-up")}</td>
                        <td className="py-3 px-4 text-on-surface-variant">{tYo("Needed to use the app")}</td>
                      </tr>
                      <tr className="bg-surface-container-low">
                        <td className="py-3 px-4 font-bold text-primary">{tYo("Equipment owners")}</td>
                        <td className="py-3 px-4">{tYo("NIN, BVN and bank account")}</td>
                        <td className="py-3 px-4">{tYo("Before listing equipment")}</td>
                        <td className="py-3 px-4 text-on-surface-variant">{tYo("With your consent")}</td>
                      </tr>
                      <tr className="bg-surface-container-lowest">
                        <td className="py-3 px-4 font-bold text-primary">{tYo("Farm hands & others paid")}</td>
                        <td className="py-3 px-4">{tYo("NIN, BVN and bank account")}</td>
                        <td className="py-3 px-4">{tYo("Before receiving payments")}</td>
                        <td className="py-3 px-4 text-on-surface-variant">{tYo("With your consent")}</td>
                      </tr>
                      <tr className="bg-surface-container-low">
                        <td className="py-3 px-4 font-bold text-primary">{tYo("Marketplace buyers")}</td>
                        <td className="py-3 px-4">{tYo("Payment checked by a licensed payment provider")}</td>
                        <td className="py-3 px-4">{tYo("At checkout")}</td>
                        <td className="py-3 px-4 text-on-surface-variant">{tYo("Card, bank transfer or USSD")}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="bg-surface-container-high p-4 rounded-xl flex items-center gap-3">
                  <Icon name="report_problem" className="text-error text-[24px] shrink-0" />
                  <p className="font-body-sm text-body-sm text-on-surface"><strong className="text-error font-semibold">{tYo("Fraud:")}</strong>{tYo(" If you upload false farm locations or fake photos, we may suspend or close your account.")}</p>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-bold">{tYo("DRAFT • CLAUSE 4")}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">{tYo("PLANNED")}</span>
                </div>
                <div>
                  <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">{tYo("Clause 4: Cancellations & Refunds (Draft, for When Escrow Is Live)")}</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">{tYo("This draft refund schedule will apply once escrow is live. It is not in force today. In the pilot you pay the provider directly, so agree cancellation terms with them before the job.")}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-surface-container-low p-5 rounded-xl flex flex-col justify-between gap-4">
                    <div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">{tYo("> 48 Hours Notice")}</span>
                      <div className="font-metric-num text-metric-num text-primary font-bold mt-2">{tYo("100% Refund")}</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">{tYo("No charge to the farmer")}</div>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("The full amount goes back to the farmer.")}</p>
                  </div>
                  <div className="bg-surface-container-low p-5 rounded-xl flex flex-col justify-between gap-4">
                    <div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-label-sm text-label-sm font-bold">{tYo("24 – 48 Hours Notice")}</span>
                      <div className="font-metric-num text-metric-num text-on-surface font-bold mt-2">{tYo("90% Refund")}</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">{tYo("10% to the operator for fuel")}</div>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Covers the operator's planning and reserved time.")}</p>
                  </div>
                  <div className="bg-surface-container-low p-5 rounded-xl flex flex-col justify-between gap-4">
                    <div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-label-sm text-label-sm font-bold">{tYo("< 24 Hours Notice")}</span>
                      <div className="font-metric-num text-metric-num text-tertiary font-bold mt-2">{tYo("75% Refund")}</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">{tYo("25% to the operator for travel")}</div>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Covers fuel used travelling to the farm.")}</p>
                  </div>
                </div>
                <div className="bg-surface-container-high p-4 rounded-xl flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <Icon name="thunderstorm" className="text-primary text-[24px]" />
                    <span className="font-body-md text-body-md text-on-surface"><strong>{tYo("Bad Weather or Breakdown:")}</strong>{tYo(" Heavy rain, flooding or a proven engine breakdown would mean free rescheduling or a full refund.")}</span>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-bold">{tYo("DRAFT • CLAUSE 5")}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">{tYo("COMING SOON")}</span>
                </div>
                <div>
                  <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">{tYo("Clause 5: Proof of Work & Disputes (Coming Soon)")}</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">{tYo("Proof of work (check-in and photos with location and time) is coming soon. Until then, if a job was not done, was done badly or was not paid, tell us in the app or through the contact page.")}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-primary">
                      <Icon name="pin_drop" className="text-[20px]" />
                      <span className="font-label-md text-label-md font-bold">{tYo("Check-in at the Farm")}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Planned: the operator checks in with the phone's location on arrival at the farm.")}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-primary">
                      <Icon name="photo_camera" className="text-[20px]" />
                      <span className="font-label-md text-label-md font-bold">{tYo("Photos with Time and Place")}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Planned: photos of the finished work, showing when and where they were taken.")}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-primary">
                      <Icon name="schedule" className="text-[20px]" />
                      <span className="font-label-md text-label-md font-bold">{tYo("Raising a Problem")}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Draft: farmers would have 48 hours after a job to raise a problem. We will publish how disputes are decided before escrow goes live.")}</p>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>
        <section className="w-full bg-surface-container-low px-6 lg:px-12 py-12">
          <div className="max-w-7xl mx-auto flex flex-col gap-8">
            <div>
              <div className="inline-flex items-center gap-2 font-label-sm text-label-sm font-bold text-secondary uppercase tracking-wider mb-1"><span className="w-2 h-2 rounded-full bg-secondary" />{tYo(" RECORDS & DOWNLOADS")}</div>
              <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl font-bold text-on-surface">{tYo("Who Runs CultivaNode & Registrations")}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mt-1">{tYo("CultivaNode is run by Excel Palace Global Concept (BN 7455859), a business name registered with the Corporate Affairs Commission. Other registrations will be listed here once we have them.")}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-xs flex flex-col justify-between gap-6">
                <div className="flex flex-col gap-2">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">{tYo("Corporate Affairs Commission (CAC)")}</span>
                  <div className="font-headline-sm text-headline-sm font-bold text-on-surface">{tYo("BN 7455859")}</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Excel Palace Global Concept, a registered business name. It runs CultivaNode until the business is incorporated.")}</p>
                </div>
                <div className="pt-4 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                  <span>{tYo("Business name registration")}</span>
                  <span className="text-secondary font-bold flex items-center gap-1"><Icon name="verified" className="text-[16px]" />{tYo(" Registered")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-xs flex flex-col justify-between gap-6">
                <div className="flex flex-col gap-2">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">{tYo("Nigeria Data Protection Commission (NDPC)")}</span>
                  <div className="font-headline-sm text-headline-sm font-bold text-on-surface">{tYo("Not registered yet")}</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("We follow the Nigeria Data Protection Act 2023. Any NDPC registration will be listed here once we have it.")}</p>
                </div>
                <div className="pt-4 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                  <span>{tYo("No audit yet")}</span>
                  <span className="text-secondary font-bold flex items-center gap-1"><Icon name="schedule" className="text-[16px]" />{tYo(" Pending")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-xs flex flex-col justify-between gap-6">
                <div className="flex flex-col gap-2">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">{tYo("Escrow Partner")}</span>
                  <div className="font-headline-sm text-headline-sm font-bold text-on-surface">{tYo("Not signed yet")}</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("We will name the licensed partner here once the agreement is signed.")}</p>
                </div>
                <div className="pt-4 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                  <span>{tYo("No escrow funds held")}</span>
                  <span className="text-secondary font-bold flex items-center gap-1"><Icon name="schedule" className="text-[16px]" />{tYo(" Coming soon")}</span>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm flex flex-col gap-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex flex-col">
                  <div className="font-headline-sm text-headline-sm font-bold text-on-surface">{tYo("Download Draft Policies")}</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Draft documents under review, for reading offline.")}</p>
                </div>
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- downloads a file from an API route, not a page */}
                <a className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md flex items-center gap-2 hover:bg-primary-container transition-colors shadow-xs" id="btn-download-all" href="/api/documents/legal-pack?download=1"><Icon name="download" className="text-[18px]" />{tYo(" Download All Drafts")}</a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col justify-between gap-3">
                  <div className="flex items-start justify-between">
                    <Icon name="picture_as_pdf" className="text-primary text-[28px]" />
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">{tYo("Draft")}</span>
                  </div>
                  <div>
                    <div className="font-label-md text-label-md font-bold text-on-surface">{tYo("Privacy Policy (Draft)")}</div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Under review")}</div>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- downloads a file from an API route, not a page */}
                  <a className="inline-flex items-center gap-1 text-primary font-label-sm text-label-sm font-semibold hover:underline" href="/api/documents/privacy-charter">{tYo("Read Policy ")}<Icon name="arrow_forward" className="text-[16px]" /></a>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col justify-between gap-3">
                  <div className="flex items-start justify-between">
                    <Icon name="picture_as_pdf" className="text-primary text-[28px]" />
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">{tYo("Draft")}</span>
                  </div>
                  <div>
                    <div className="font-label-md text-label-md font-bold text-on-surface">{tYo("Terms of Use (Draft)")}</div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Under review")}</div>
                  </div>
                  <Link className="inline-flex items-center gap-1 text-primary font-label-sm text-label-sm font-semibold hover:underline" href={`/${lang}/terms`}>{tYo("Read Terms ")}<Icon name="arrow_forward" className="text-[16px]" /></Link>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col justify-between gap-3">
                  <div className="flex items-start justify-between">
                    <Icon name="picture_as_pdf" className="text-primary text-[28px]" />
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">{tYo("Draft")}</span>
                  </div>
                  <div>
                    <div className="font-label-md text-label-md font-bold text-on-surface">{tYo("Bookings & Cancellations (Draft)")}</div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Under review")}</div>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- downloads a file from an API route, not a page */}
                  <a className="inline-flex items-center gap-1 text-primary font-label-sm text-label-sm font-semibold hover:underline" href="/api/documents/escrow-rules">{tYo("Read Policy ")}<Icon name="arrow_forward" className="text-[16px]" /></a>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col justify-between gap-3">
                  <div className="flex items-start justify-between">
                    <Icon name="picture_as_pdf" className="text-primary text-[28px]" />
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">{tYo("Draft")}</span>
                  </div>
                  <div>
                    <div className="font-label-md text-label-md font-bold text-on-surface">{tYo("Disputes (Draft)")}</div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Under review")}</div>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- downloads a file from an API route, not a page */}
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
