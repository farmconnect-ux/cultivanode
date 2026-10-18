"use client";

// Ported from the "contact_extension_liaison_support_cultivanode" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import { slot, type ScreenProps } from "./types";
import { showScreenToast } from "@/components/screens/screen-toast";
import { phrasebook } from "@/i18n/marketing";
import YO from "@/i18n/yo-marketing/contact-page";

const tYo = phrasebook(YO);

export type ContactPageSlot = "form";

export function ContactPage({ lang, slots }: ScreenProps<ContactPageSlot>) {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    showScreenToast(tYo.now("Support Ticket Transmitted"), tYo.now("Ticket reference CN-2025-4819 generated. Regional ADP officer notified."));
  };
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <section className="w-full bg-surface-container-low px-6 lg:px-12 py-6">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-label-md"><span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />{tYo(" Support Desks Online")}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Avg field response: ")}<strong className="text-on-surface font-semibold">{tYo("18 mins")}</strong>{tYo(" (Cluster Tier-1)")}</span>
              <span className="hidden md:inline-block w-1.5 h-1.5 rounded-full bg-outline-variant" />
              <span className="font-body-sm text-body-sm text-on-surface-variant"><strong className="text-on-surface font-semibold">{tYo("28 ADP")}</strong>{tYo(" Regional Field Stations Active")}</span>
              <span className="hidden md:inline-block w-1.5 h-1.5 rounded-full bg-outline-variant" />
              <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1"><Icon name="verified_user" className="text-[16px] text-secondary" />{tYo(" Providus & Wema Escrow Reconciliation Desk Live")}</span>
            </div>
            <div className="flex items-center gap-4 text-on-surface-variant font-label-sm text-label-sm">
              <span className="uppercase tracking-widest text-[10px] font-semibold text-on-surface-variant">{tYo("Protocol")}</span>
              <span className="whitespace-nowrap px-2.5 py-1 rounded bg-surface-container-highest text-on-surface font-mono font-medium">{tYo("NDPA 2023 / SLA-99.8%")}</span>
            </div>
          </div>
        </section>
        <section className="w-full bg-surface px-6 lg:px-12 pt-12 pb-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col max-w-4xl gap-4">
              <div className="flex items-center gap-2">
                <Icon name="hub" className="text-primary text-[20px]" />
                <span className="font-label-lg text-label-lg uppercase tracking-wider text-primary">{tYo("Direct Regional Extension & Incident Desk")}</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary leading-tight font-bold">{tYo("Connect with CultivaNode Agrarian Support & Regional Desks")}</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant">{tYo("Direct technical, operational, and agronomist assistance across Oyo, Ogun, Ondo, Osun, Ekiti, and Lagos. We operate under guaranteed service-level agreements and Nigeria Data Protection Act (NDPA 2023) compliance.")}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
              <div className="bg-surface-container-lowest p-5 rounded-lg shadow-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider block mb-1">{tYo("Hotline Uptime")}</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-num text-metric-num text-primary">99.9%</span>
                  <span className="font-label-sm text-label-sm text-secondary font-medium">{tYo("24/7 Voicemail/SMS")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-5 rounded-lg shadow-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider block mb-1">{tYo("Languages Supported")}</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-num text-metric-num text-primary">3</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Yorùbá, Pidgin, Eng")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-5 rounded-lg shadow-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider block mb-1">{tYo("Corridors Covered")}</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-num text-metric-num text-primary">6</span>
                  <span className="font-label-sm text-label-sm text-secondary font-medium">{tYo("South-West Mesh")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-5 rounded-lg shadow-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider block mb-1">{tYo("Escrow Resolution SLA")}</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-num text-metric-num text-primary">&lt; 48h</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("CBN Banking Rails")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full bg-surface-container-low px-6 lg:px-12 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-semibold">{tYo("Priority Routing")}</span>
                <h2 className="font-headline-lg text-headline-lg text-primary mt-1">{tYo("Direct Support Channels")}</h2>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">{tYo("Immediate phone access, specialized WhatsApp field voice-note routing, and inter-institutional banking escalations.")}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-primary-container text-on-primary flex items-center justify-center mb-6">
                    <Icon name="potted_plant" className="text-[26px]" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-label-sm bg-secondary-container text-on-secondary-container uppercase">{tYo("Field Dispatch")}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Voice Note Capable")}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary mb-2">{tYo("Immediate Agronomy & Field Hotline")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">{tYo("Direct technical help for pest incidence, early leaf spot outbreaks, fertilizer telemetry calibrations, and emergency cluster diagnostics with ADP agronomists.")}</p>
                </div>
                <div className="space-y-4 pt-4 bg-surface-container-low -mx-6 -mb-6 p-6 rounded-b-lg">
                  <div className="flex items-center justify-between text-on-surface">
                    <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">{tYo("National Toll-Free")}</span>
                    <a className="font-label-lg text-label-lg font-bold text-primary hover:underline" href="tel:+2348002858482">{tYo("+234 800-CULTIVA")}</a>
                  </div>
                  <div className="flex items-center justify-between text-on-surface">
                    <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">{tYo("WhatsApp Voice Triage")}</span>
                    <a className="font-label-sm text-label-sm font-semibold text-secondary flex items-center gap-1 hover:underline" href="https://wa.me/2348002858482?text=Emergency%20Agronomic%20Assistance" target="_blank" rel="noopener noreferrer"><Icon name="chat" className="text-[16px]" />{tYo(" Yorùbá / Pidgin / Eng")}</a>
                  </div>
                  <a className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container transition-colors shadow-sm" href="https://wa.me/2348002858482?text=Emergency%20Agronomic%20Assistance" target="_blank" rel="noopener noreferrer"><Icon name="cell_tower" className="text-[18px]" />{tYo(" Launch WhatsApp Voice Desk")}</a>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-tertiary-container text-on-tertiary flex items-center justify-center mb-6">
                    <Icon name="agriculture" className="text-[26px]" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-label-sm bg-tertiary-fixed text-on-tertiary-fixed uppercase">{tYo("Fleet & Escrow")}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("48h Resolution")}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary mb-2">{tYo("Escrow, Booking & Mechanization Helpdesk")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">{tYo("Assistance for active tractor rentals, GPS-tracked operator check-in issues, non-mobilized equipment refunds, or filing escrow dispute arbitrations.")}</p>
                </div>
                <div className="space-y-4 pt-4 bg-surface-container-low -mx-6 -mb-6 p-6 rounded-b-lg">
                  <div className="flex items-center justify-between text-on-surface">
                    <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">{tYo("Escrow Audit Desk")}</span>
                    <span className="font-label-lg text-label-lg font-bold text-primary font-mono">{tYo("desk@escrow.cultivanode.ng")}</span>
                  </div>
                  <div className="flex items-center justify-between text-on-surface">
                    <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">{tYo("Dispute SLA Window")}</span>
                    <span className="font-label-sm text-label-sm font-semibold text-tertiary-container">{tYo("Strict 48-Hour Guarantee")}</span>
                  </div>
                  <a className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-surface-container-highest text-on-surface font-label-lg text-label-lg hover:bg-surface-container transition-colors shadow-sm" href="#contact-inquiry-form"><Icon name="receipt_long" className="text-[18px]" />{tYo(" File Mechanization Dispute")}</a>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-surface-container-high text-primary flex items-center justify-center mb-6">
                    <Icon name="account_balance" className="text-[26px]" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-label-sm bg-surface-container-highest text-on-surface uppercase">{tYo("Institutional")}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("CBN Settlement")}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary mb-2">{tYo("Institutional, Bank & Partner Directorate")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">{tYo("Dedicated channel for agricultural commercial lenders, Providus Bank and Wema Bank settlement reconciliations, state ministries, IITA, and NCRI agronomists.")}</p>
                </div>
                <div className="space-y-4 pt-4 bg-surface-container-low -mx-6 -mb-6 p-6 rounded-b-lg">
                  <div className="flex items-center justify-between text-on-surface">
                    <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">{tYo("Directorate Email")}</span>
                    <span className="font-label-lg text-label-lg font-bold text-primary font-mono">{tYo("institutional@cultivanode.ng")}</span>
                  </div>
                  <div className="flex items-center justify-between text-on-surface">
                    <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">{tYo("Escrow Verification")}</span>
                    <span className="font-label-sm text-label-sm font-semibold text-secondary">{tYo("Providus API Ready")}</span>
                  </div>
                  <a className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-surface-container-highest text-on-surface font-label-lg text-label-lg hover:bg-surface-container transition-colors shadow-sm" href="mailto:institutional@cultivanode.ng?subject=Institutional%20Partnership%20Inquiry"><Icon name="verified" className="text-[18px]" />{tYo(" Contact Institutional Liaison")}</a>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full bg-surface px-6 lg:px-12 py-16" id="contact-inquiry-form">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-5 flex flex-col justify-between">
                <div>
                  <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-semibold">{tYo("Incident & Ticket Transmittal")}</span>
                  <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary mt-1 mb-4">{tYo("Transmit a Verified Field Dossier")}</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-6">{tYo("Submit your inquiry to trigger automatic geofenced dispatch. Tickets marked with urgent alerts directly page cluster extension officers and certified machinery operators on ground within 20 kilometers.")}</p>
                  <div className="bg-surface-container-low p-6 rounded-lg space-y-4 mb-6">
                    <h4 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2"><Icon name="security" className="text-secondary" />{tYo(" Data Protection & Escrow Governance")}</h4>
                    <ul className="space-y-3 font-body-sm text-body-sm text-on-surface-variant">
                      <li className="flex items-start gap-2.5">
                        <Icon name="check_circle" className="text-secondary text-[18px] shrink-0 mt-0.5" />
                        <span><strong>{tYo("NDPA 2023 Compliant:")}</strong>{tYo(" Field photos and geocoordinates are encrypted and never disclosed to third parties without operational authorization.")}</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Icon name="check_circle" className="text-secondary text-[18px] shrink-0 mt-0.5" />
                        <span><strong>{tYo("Providus & Wema Escrow Oversight:")}</strong>{tYo(" Mechanization and grain contract arbitration requests create auditable immutable audit trails.")}</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Icon name="check_circle" className="text-secondary text-[18px] shrink-0 mt-0.5" />
                        <span><strong>{tYo("Bilingual Operator Desks:")}</strong>{tYo(" Yorùbá voice memos submitted via WhatsApp are instantly linked to open ticket references.")}</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-surface-container-lowest p-4 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-label-sm text-label-sm uppercase font-semibold text-on-surface-variant">{tYo("Field Scouting Integration")}</span>
                      <span className="font-label-sm text-label-sm text-secondary bg-secondary-container px-2 py-0.5 rounded">{tYo("GPS Enabled")}</span>
                    </div>
                    <div className="relative w-full h-44 rounded-lg overflow-hidden bg-surface-container">
                      <img className="w-full h-full object-cover" data-alt="Close up photograph of a cassava crop leaf inspected for mosaic disease in an agricultural testing field in Oyo State Nigeria under bright daylight, sharp high detail botanical agronomic imagery" src="/images/screens/e44c9db323b4.webp" alt="" loading="lazy" decoding="async" />
                      <div className="absolute bottom-2 left-2 right-2 bg-inverse-surface/80 backdrop-blur-sm text-inverse-on-surface px-3 py-1.5 rounded text-[11px] font-mono flex items-center justify-between">
                        <span>{tYo("LAT 7.8540° N, LON 3.9312° E")}</span>
                        <span className="text-secondary-fixed">{tYo("Oke-Ogun Hub Node")}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-6">
                  <span className="font-label-sm text-label-sm text-on-surface-variant block">{tYo("Need instant offline triage? Dial ")}<a className="font-bold text-primary underline" href="tel:+2348002858482">{tYo("+234 800-CULTIVA")}</a>{tYo(" or send an SMS with your farm corridor code.")}</span>
                </div>
              </div>
              {slot(slots, "form", (
                <div className="lg:col-span-7 bg-surface-container-lowest p-8 lg:p-10 rounded-lg shadow-sm">
                  <div className="space-y-6" id="public-support-ticket-form" role="form">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-sm text-label-sm text-on-surface font-semibold uppercase tracking-wider" htmlFor="fullName">{tYo("Full Name / Enterprise Rep ")}<span className="text-error">*</span></label>
                        <input className="h-10 px-3.5 rounded-lg bg-surface text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary" id="fullName" name="fullName" placeholder={tYo("e.g. Babatunde Adeleke")} required type="text" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-sm text-label-sm text-on-surface font-semibold uppercase tracking-wider" htmlFor="phoneNumber">{tYo("Phone (+234 WhatsApp Preferred) ")}<span className="text-error">*</span></label>
                        <input className="h-10 px-3.5 rounded-lg bg-surface text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary" id="phoneNumber" name="phoneNumber" placeholder="+234 803 123 4567" required type="tel" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-sm text-label-sm text-on-surface font-semibold uppercase tracking-wider" htmlFor="emailAddress">{tYo("Email Address ")}<span className="text-error">*</span></label>
                        <input className="h-10 px-3.5 rounded-lg bg-surface text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary" id="emailAddress" name="emailAddress" placeholder={tYo("babatunde@farmgroup.ng")} required type="email" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-sm text-label-sm text-on-surface font-semibold uppercase tracking-wider" htmlFor="categorySelector">{tYo("Inquiry Category ")}<span className="text-error">*</span></label>
                        <select defaultValue="" className="h-10 px-3.5 rounded-lg bg-surface text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer" id="categorySelector" name="categorySelector" required>
                          <option disabled value="">{tYo("Select category...")}</option>
                          <option value="farmer_ops">{tYo("Farmer Operational Support")}</option>
                          <option value="tractor_mechanization">{tYo("Tractor Syndicate / Mechanization Booking")}</option>
                          <option value="input_marketplace">{tYo("Input Dealer / Marketplace Vendor")}</option>
                          <option value="institutional_bank">{tYo("Institutional / Bank Partnership")}</option>
                          <option value="ndpa_request">{tYo("Statutory / NDPA Data Request")}</option>
                          <option value="general_inquiry">{tYo("General Cluster Inquiry")}</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-sm text-label-sm text-on-surface font-semibold uppercase tracking-wider" htmlFor="corridorSelector">{tYo("State / Agrarian Corridor ")}<span className="text-error">*</span></label>
                      <select defaultValue="" className="h-10 px-3.5 rounded-lg bg-surface text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer" id="corridorSelector" name="corridorSelector" required>
                        <option disabled value="">{tYo("Select corridor for geo-routing...")}</option>
                        <option value="oyo_okeogun">{tYo("Oyo State - Oke-Ogun Maize & Cassava Corridor (Saki, Iseyin)")}</option>
                        <option value="oyo_ibadan">{tYo("Oyo State - Ibadan Agri-Central & Ogbomoso")}</option>
                        <option value="ogun_egba">{tYo("Ogun State - Egba/Yewa Agro-Forestry Belt (Abeokuta, Ilaro)")}</option>
                        <option value="osun_agro">{tYo("Osun State - Agro-Valley Grain Cluster (Osogbo, Ilesa)")}</option>
                        <option value="ondo_cashcrop">{tYo("Ondo State - Cash Crops & Cocoa Syndicate (Akure, Ondo Town)")}</option>
                        <option value="ekiti_agri">{tYo("Ekiti State - Upland Rice & Cassava Hub (Ado-Ekiti)")}</option>
                        <option value="lagos_hub">{tYo("Lagos Agri-Hub - Aggregation & Epe Export Terminal")}</option>
                      </select>
                    </div>
                    <div className="p-4 rounded-lg bg-surface-container-low flex items-start gap-3">
                      <input className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer accent-primary" id="urgentPriorityToggle" name="urgentPriorityToggle" type="checkbox" />
                      <label className="cursor-pointer" htmlFor="urgentPriorityToggle">
                        <span className="font-label-md text-label-md text-on-surface font-bold flex items-center gap-1.5"><Icon name="warning" className="text-error text-[18px]" />{tYo(" Urgent Priority Incident: Active field breakdown or pest outbreak")}</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant block mt-0.5">{tYo("Triggers immediate SMS alerts to the local extension officer on patrol and moves ticket to the top of the queue.")}</span>
                      </label>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-sm text-label-sm text-on-surface font-semibold uppercase tracking-wider" htmlFor="fieldDossierDetails">{tYo("Field Dossier Details / Operational Narrative ")}<span className="text-error">*</span></label>
                      <textarea className="p-3.5 rounded-lg bg-surface text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary resize-y" id="fieldDossierDetails" name="fieldDossierDetails" placeholder={tYo("Detail crop type, affected hectares, machine booking ID (if applicable), or exact symptoms noticed...")} required rows={4} />
                    </div>
                    <div className="p-4 rounded-lg bg-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-high text-primary flex items-center justify-center shrink-0">
                          <Icon name="add_photo_alternate" className="text-[20px]" />
                        </div>
                        <div>
                          <span className="font-label-sm text-label-sm font-semibold text-on-surface block">{tYo("Optional Geotagged Photo or PDF")}</span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("PNG, JPG, or PDF up to 15MB. WhatsApp photos accepted.")}</span>
                        </div>
                      </div>
                      <label className="cursor-pointer shrink-0 px-4 py-2 rounded-lg bg-surface-container-lowest font-label-sm text-label-sm text-primary font-semibold hover:bg-surface-container transition-colors shadow-sm">{tYo("Attach File ")}<input accept="image/*,.pdf" className="hidden" type="file" /></label>
                    </div>
                    <div className="flex items-start gap-3">
                      <input className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer accent-primary" id="ndpaConsentCheckbox" name="ndpaConsentCheckbox" required type="checkbox" />
                      <label className="font-body-sm text-body-sm text-on-surface-variant cursor-pointer" htmlFor="ndpaConsentCheckbox">{tYo("I hereby consent to CultivaNode collecting and processing this incident data according to the ")}<strong className="text-on-surface">{tYo("Nigeria Data Protection Act (NDPA 2023)")}</strong>{tYo(" and the terms detailed in the ")}<Link className="text-primary underline font-semibold" href={`/${lang}/privacy`}>{tYo("Privacy Policy")}</Link>.</label>
                    </div>
                    <div>
                      <button onClick={handleSubmit} className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg font-bold hover:bg-primary transition-colors shadow-sm" id="submitTicketBtn" type="submit"><Icon name="send" className="text-[20px]" />{tYo(" Transmit Verified Support Ticket")}</button>
                    </div>
                    <div className={`${submitted ? "block" : "hidden"} p-4 rounded-lg bg-secondary-container text-on-secondary-container`} id="form-success-toast">
                      <div className="flex items-center gap-3">
                        <Icon name="check_circle" className="text-[24px] text-secondary" />
                        <div>
                          <p className="font-label-lg text-label-lg font-bold">{tYo("Ticket Transmitted Successfully!")}</p>
                          <p className="font-body-sm text-body-sm">{tYo("Reference Code: ")}<span className="font-mono font-bold" id="ticket-ref-display">{tYo("CN-2025-XXXX")}</span>{tYo(". A regional field agronomist has been notified via WhatsApp telemetry.")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="w-full bg-surface-container-low px-6 lg:px-12 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-semibold">{tYo("Physical Presence")}</span>
                <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary mt-1">{tYo("Regional Cluster Stations & Field HQs")}</h2>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">{tYo("Walk into any accredited ADP partner node or mechanization station for face-to-face onboarding, machine inspections, and agronomist meetings.")}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-surface-container-lowest rounded-lg overflow-hidden shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-full h-40 bg-cover bg-center" data-location="Ibadan, Nigeria" style={{ backgroundImage: "url('/images/screens/c660aea6805c.webp')" }} />
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-label-sm bg-primary-container text-on-primary uppercase font-bold">{tYo("Central HQ")}</span>
                      <span className="font-label-sm text-label-sm text-secondary font-medium">{tYo("Open 07:30 - 18:00")}</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-primary mb-1">{tYo("Ibadan Operational HQ")}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">{tYo("Agrarian Innovation Hub, Agodi GRA, Ibadan, Oyo State.")}</p>
                    <div className="space-y-2 pt-3 bg-surface-container-low -mx-6 px-6 py-4">
                      <div className="flex items-center gap-2 text-on-surface font-body-sm text-body-sm">
                        <Icon name="call" className="text-[18px] text-secondary" />
                        <span>+234 2 291 4080</span>
                      </div>
                      <div className="flex items-center gap-2 text-on-surface font-body-sm text-body-sm">
                        <Icon name="mail" className="text-[18px] text-secondary" />
                        <span className="font-mono text-[12px]">{tYo("ibadan@cultivanode.ng")}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-surface-container-low pt-0">
                  <a className="w-full py-2 px-3 rounded bg-surface-container-highest text-primary font-label-sm text-label-sm font-semibold flex items-center justify-center gap-1 hover:bg-surface-container transition-colors" href="https://maps.google.com" target="_blank" rel="noopener noreferrer"><Icon name="directions" className="text-[16px]" />{tYo(" Get Directions")}</a>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-lg overflow-hidden shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-full h-40 bg-cover bg-center" data-location="Saki, Oyo State, Nigeria" style={{ backgroundImage: "url('/images/screens/8045f0484d54.webp')" }} />
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-label-sm bg-secondary-container text-on-secondary-container uppercase font-bold">{tYo("Tractor Hub")}</span>
                      <span className="font-label-sm text-label-sm text-secondary font-medium">{tYo("Open 06:00 - 19:00")}</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-primary mb-1">{tYo("Oke-Ogun Mechanization Hub")}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">{tYo("Saki-Iseyin Agrarian Junction, Saki West LGA, Oyo State.")}</p>
                    <div className="space-y-2 pt-3 bg-surface-container-low -mx-6 px-6 py-4">
                      <div className="flex items-center gap-2 text-on-surface font-body-sm text-body-sm">
                        <Icon name="call" className="text-[18px] text-secondary" />
                        <span>+234 814 883 1920</span>
                      </div>
                      <div className="flex items-center gap-2 text-on-surface font-body-sm text-body-sm">
                        <Icon name="mail" className="text-[18px] text-secondary" />
                        <span className="font-mono text-[12px]">{tYo("okeogun@cultivanode.ng")}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-surface-container-low pt-0">
                  <a className="w-full py-2 px-3 rounded bg-surface-container-highest text-primary font-label-sm text-label-sm font-semibold flex items-center justify-center gap-1 hover:bg-surface-container transition-colors" href="https://maps.google.com" target="_blank" rel="noopener noreferrer"><Icon name="directions" className="text-[16px]" />{tYo(" Get Directions")}</a>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-lg overflow-hidden shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-full h-40 bg-cover bg-center" data-location="Abeokuta, Nigeria" style={{ backgroundImage: "url('/images/screens/a060fb0f800a.webp')" }} />
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-label-sm bg-surface-container-high text-on-surface uppercase font-bold">{tYo("OGADEP Office")}</span>
                      <span className="font-label-sm text-label-sm text-secondary font-medium">{tYo("Open 08:00 - 17:00")}</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-primary mb-1">{tYo("Ogun Agro-Forestry Liaison")}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">{tYo("OGADEP Complex, Idi-Aba, Abeokuta, Ogun State.")}</p>
                    <div className="space-y-2 pt-3 bg-surface-container-low -mx-6 px-6 py-4">
                      <div className="flex items-center gap-2 text-on-surface font-body-sm text-body-sm">
                        <Icon name="call" className="text-[18px] text-secondary" />
                        <span>+234 809 119 5541</span>
                      </div>
                      <div className="flex items-center gap-2 text-on-surface font-body-sm text-body-sm">
                        <Icon name="mail" className="text-[18px] text-secondary" />
                        <span className="font-mono text-[12px]">{tYo("ogun@cultivanode.ng")}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-surface-container-low pt-0">
                  <a className="w-full py-2 px-3 rounded bg-surface-container-highest text-primary font-label-sm text-label-sm font-semibold flex items-center justify-center gap-1 hover:bg-surface-container transition-colors" href="https://maps.google.com" target="_blank" rel="noopener noreferrer"><Icon name="directions" className="text-[16px]" />{tYo(" Get Directions")}</a>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-lg overflow-hidden shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-full h-40 bg-cover bg-center" data-location="Akure, Ondo State, Nigeria" style={{ backgroundImage: "url('/images/screens/a7f557eb0b2a.webp')" }} />
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-label-sm bg-tertiary-fixed text-on-tertiary-fixed uppercase font-bold">{tYo("Cocoa Belt")}</span>
                      <span className="font-label-sm text-label-sm text-secondary font-medium">{tYo("Open 07:30 - 17:30")}</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-primary mb-1">{tYo("Ondo Cash Crops Node")}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">{tYo("Alagbaka Government Reserve, Akure, Ondo State.")}</p>
                    <div className="space-y-2 pt-3 bg-surface-container-low -mx-6 px-6 py-4">
                      <div className="flex items-center gap-2 text-on-surface font-body-sm text-body-sm">
                        <Icon name="call" className="text-[18px] text-secondary" />
                        <span>+234 811 500 7733</span>
                      </div>
                      <div className="flex items-center gap-2 text-on-surface font-body-sm text-body-sm">
                        <Icon name="mail" className="text-[18px] text-secondary" />
                        <span className="font-mono text-[12px]">{tYo("ondo@cultivanode.ng")}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-surface-container-low pt-0">
                  <a className="w-full py-2 px-3 rounded bg-surface-container-highest text-primary font-label-sm text-label-sm font-semibold flex items-center justify-center gap-1 hover:bg-surface-container transition-colors" href="https://maps.google.com" target="_blank" rel="noopener noreferrer"><Icon name="directions" className="text-[16px]" />{tYo(" Get Directions")}</a>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full bg-surface px-6 lg:px-12 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-semibold">{tYo("Immediate Clarity")}</span>
              <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary mt-1">{tYo("Frequently Answered Liaison Inquiries")}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">{tYo("Clear procedural guidelines on field arrival times, tractor disputes, and multilingual agronomic dispatch.")}</p>
            </div>
            <div className="space-y-4">
              <details className="bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden faq-item group">
                <summary className="w-full flex items-center justify-between p-6 text-left focus:outline-none hover:bg-surface-container-low transition-colors list-none [&::-webkit-details-marker]:hidden">
                  <span className="font-headline-sm text-headline-sm text-primary font-semibold pr-4">{tYo("How quickly does a field extension officer respond to crop emergencies?")}</span>
                  <Icon name="expand_more" className="text-primary text-[24px] transform transition-transform duration-200 faq-icon group-open:rotate-180" />
                </summary>
                <div className="faq-content px-6 pb-6 pt-0 bg-surface-container-lowest">
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{tYo("When an urgent priority incident is flagged through the portal or hotline, our geofenced telemetry alerts the closest accredited Agricultural Development Programme (ADP) extension officer within 20 km. Our current average physical on-farm response window across Oyo (Oke-Ogun), Ogun, and Ondo clusters is ")}<strong>{tYo("18 to 45 minutes")}</strong>{tYo(" during daylight operating hours (06:30 - 18:30 WAT).")}</p>
                </div>
              </details>
              <details className="bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden faq-item group">
                <summary className="w-full flex items-center justify-between p-6 text-left focus:outline-none hover:bg-surface-container-low transition-colors list-none [&::-webkit-details-marker]:hidden">
                  <span className="font-headline-sm text-headline-sm text-primary font-semibold pr-4">{tYo("Who do I call if my hired tractor doesn't arrive on the booking date?")}</span>
                  <Icon name="expand_more" className="text-primary text-[24px] transform transition-transform duration-200 faq-icon group-open:rotate-180" />
                </summary>
                <div className="faq-content px-6 pb-6 pt-0 bg-surface-container-lowest">
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{tYo("Contact our ")}<strong>{tYo("Escrow & Mechanization Desk immediately at +234 800-CULTIVA (Option 2)")}</strong>{tYo(" or select 'Tractor Syndicate / Mechanization' in the form above. Under CultivaNode escrow protocols backed by Providus Bank and Wema Bank, your payment is held securely in escrow until the operator GPS checks in at your farm coordinates. If mobilization fails within 4 hours of the scheduled time without severe weather justification, we auto-reassign a nearby standby tractor or release 100% of your funds within 48 hours.")}</p>
                </div>
              </details>
              <details className="bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden faq-item group">
                <summary className="w-full flex items-center justify-between p-6 text-left focus:outline-none hover:bg-surface-container-low transition-colors list-none [&::-webkit-details-marker]:hidden">
                  <span className="font-headline-sm text-headline-sm text-primary font-semibold pr-4">{tYo("Can I submit pest photos directly via WhatsApp in Yorùbá?")}</span>
                  <Icon name="expand_more" className="text-primary text-[24px] transform transition-transform duration-200 faq-icon group-open:rotate-180" />
                </summary>
                <div className="faq-content px-6 pb-6 pt-0 bg-surface-container-lowest">
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed"><strong>{tYo("Bẹ́ẹ̀ni (Yes).")}</strong>{tYo(" Our WhatsApp Agronomy Desk (+234 800-CULTIVA) supports voice notes, video clips, and high-resolution imagery in standard Yorùbá, Nigerian Pidgin, and English. Our regional agronomists transcribe and log the audio into our incident management database, returning diagnostic advice and recommended spraying windows directly via WhatsApp audio voice notes.")}</p>
                </div>
              </details>
              <details className="bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden faq-item group">
                <summary className="w-full flex items-center justify-between p-6 text-left focus:outline-none hover:bg-surface-container-low transition-colors list-none [&::-webkit-details-marker]:hidden">
                  <span className="font-headline-sm text-headline-sm text-primary font-semibold pr-4">{tYo("How does CultivaNode comply with the Nigeria Data Protection Act (NDPA 2023)?")}</span>
                  <Icon name="expand_more" className="text-primary text-[24px] transform transition-transform duration-200 faq-icon group-open:rotate-180" />
                </summary>
                <div className="faq-content px-6 pb-6 pt-0 bg-surface-container-lowest">
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{tYo("All farmer cluster rosters, contact details, land polygon boundaries, and escrow banking tokens are encrypted under strict NDPA 2023 regulations. We do not sell or monetize farm-level agronomic data to private third-party marketing entities. Field officers only view farm details necessary to execute direct mechanization or extension visits.")}</p>
                </div>
              </details>
            </div>
          </div>
        </section>
        <section className="w-full px-6 lg:px-12 pb-16">
          <div className="max-w-7xl mx-auto rounded-xl bg-primary text-on-primary p-8 lg:p-12 relative overflow-hidden shadow-lg">
            <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-secondary/20 pointer-events-none" />
            <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-primary-container/40 pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-on-secondary font-label-sm text-label-sm mb-4"><span className="w-2 h-2 rounded-full bg-secondary-container animate-ping" />{tYo(" Critical Cluster Incident Alert")}</div>
                <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-primary font-bold mb-3">{tYo("Facing an active armyworm invasion, blight outbreak, or stranded machinery?")}</h2>
                <p className="font-body-md text-body-md text-on-primary-container max-w-xl">{tYo("Do not wait for formal tickets. Dial our priority agronomist dispatch desk immediately or ping the emergency WhatsApp hotline with your GPS coordinates.")}</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0 w-full lg:w-auto">
                <a className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-lg bg-surface-container-lowest text-primary font-label-lg text-label-lg font-bold hover:bg-surface-container-low transition-colors shadow-md text-center" href="tel:+2348002858482"><Icon name="phone_in_talk" className="text-[22px] text-primary" />{tYo(" Call +234 800-CULTIVA")}</a>
                <a className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-lg bg-secondary text-on-secondary font-label-lg text-label-lg font-bold hover:bg-secondary/90 transition-colors shadow-md text-center" href="https://wa.me/2348002858482?text=EMERGENCY%3A%20Urgent%20Field%20Outbreak" target="_blank" rel="noopener noreferrer"><Icon name="emergency_home" className="text-[22px]" />{tYo(" Emergency WhatsApp Dispatch")}</a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
