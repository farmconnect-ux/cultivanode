// Ported from the "contact_extension_liaison_support_cultivanode" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import { slot, type ScreenProps } from "./types";

export type ContactPageSlot = "form";

export function ContactPage({ lang, slots }: ScreenProps<ContactPageSlot>) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <section className="w-full bg-surface-container-low px-6 lg:px-12 py-6">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-label-md"><span className="w-2 h-2 rounded-full bg-secondary animate-pulse" /> Support Desks Online</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Avg field response: <strong className="text-on-surface font-semibold">18 mins</strong> (Cluster Tier-1)</span>
              <span className="hidden md:inline-block w-1.5 h-1.5 rounded-full bg-outline-variant" />
              <span className="font-body-sm text-body-sm text-on-surface-variant"><strong className="text-on-surface font-semibold">28 ADP</strong> Regional Field Stations Active</span>
              <span className="hidden md:inline-block w-1.5 h-1.5 rounded-full bg-outline-variant" />
              <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1"><Icon name="verified_user" className="text-[16px] text-secondary" /> Providus &amp; Wema Escrow Reconciliation Desk Live</span>
            </div>
            <div className="flex items-center gap-4 text-on-surface-variant font-label-sm text-label-sm">
              <span className="uppercase tracking-widest text-[10px] font-semibold text-on-surface-variant">Protocol</span>
              <span className="whitespace-nowrap px-2.5 py-1 rounded bg-surface-container-highest text-on-surface font-mono font-medium">NDPA 2023 / SLA-99.8%</span>
            </div>
          </div>
        </section>
        <section className="w-full bg-surface px-6 lg:px-12 pt-12 pb-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col max-w-4xl gap-4">
              <div className="flex items-center gap-2">
                <Icon name="hub" className="text-primary text-[20px]" />
                <span className="font-label-lg text-label-lg uppercase tracking-wider text-primary">Direct Regional Extension &amp; Incident Desk</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary leading-tight font-bold">Connect with CultivaNode Agrarian Support &amp; Regional Desks</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant">Direct technical, operational, and agronomist assistance across Oyo, Ogun, Ondo, Osun, Ekiti, and Lagos. We operate under guaranteed service-level agreements and Nigeria Data Protection Act (NDPA 2023) compliance.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
              <div className="bg-surface-container-lowest p-5 rounded-lg shadow-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider block mb-1">Hotline Uptime</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-num text-metric-num text-primary">99.9%</span>
                  <span className="font-label-sm text-label-sm text-secondary font-medium">24/7 Voicemail/SMS</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-5 rounded-lg shadow-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider block mb-1">Languages Supported</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-num text-metric-num text-primary">3</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Yorùbá, Pidgin, Eng</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-5 rounded-lg shadow-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider block mb-1">Corridors Covered</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-num text-metric-num text-primary">6</span>
                  <span className="font-label-sm text-label-sm text-secondary font-medium">South-West Mesh</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-5 rounded-lg shadow-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider block mb-1">Escrow Resolution SLA</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-num text-metric-num text-primary">&lt; 48h</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">CBN Banking Rails</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full bg-surface-container-low px-6 lg:px-12 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-semibold">Priority Routing</span>
                <h2 className="font-headline-lg text-headline-lg text-primary mt-1">Direct Support Channels</h2>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">Immediate phone access, specialized WhatsApp field voice-note routing, and inter-institutional banking escalations.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-primary-container text-on-primary flex items-center justify-center mb-6">
                    <Icon name="potted_plant" className="text-[26px]" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-label-sm bg-secondary-container text-on-secondary-container uppercase">Field Dispatch</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Voice Note Capable</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary mb-2">Immediate Agronomy &amp; Field Hotline</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">Direct technical help for pest incidence, early leaf spot outbreaks, fertilizer telemetry calibrations, and emergency cluster diagnostics with ADP agronomists.</p>
                </div>
                <div className="space-y-4 pt-4 bg-surface-container-low -mx-6 -mb-6 p-6 rounded-b-lg">
                  <div className="flex items-center justify-between text-on-surface">
                    <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">National Toll-Free</span>
                    <a className="font-label-lg text-label-lg font-bold text-primary hover:underline" href="tel:+2348002858482">+234 800-CULTIVA</a>
                  </div>
                  <div className="flex items-center justify-between text-on-surface">
                    <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">WhatsApp Voice Triage</span>
                    <a className="font-label-sm text-label-sm font-semibold text-secondary flex items-center gap-1 hover:underline" href="https://wa.me/2348002858482?text=Emergency%20Agronomic%20Assistance" target="_blank" rel="noopener noreferrer"><Icon name="chat" className="text-[16px]" /> Yorùbá / Pidgin / Eng</a>
                  </div>
                  <a className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container transition-colors shadow-sm" href="https://wa.me/2348002858482?text=Emergency%20Agronomic%20Assistance" target="_blank" rel="noopener noreferrer"><Icon name="cell_tower" className="text-[18px]" /> Launch WhatsApp Voice Desk</a>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-tertiary-container text-on-tertiary flex items-center justify-center mb-6">
                    <Icon name="agriculture" className="text-[26px]" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-label-sm bg-tertiary-fixed text-on-tertiary-fixed uppercase">Fleet &amp; Escrow</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">48h Resolution</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary mb-2">Escrow, Booking &amp; Mechanization Helpdesk</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">Assistance for active tractor rentals, GPS-tracked operator check-in issues, non-mobilized equipment refunds, or filing escrow dispute arbitrations.</p>
                </div>
                <div className="space-y-4 pt-4 bg-surface-container-low -mx-6 -mb-6 p-6 rounded-b-lg">
                  <div className="flex items-center justify-between text-on-surface">
                    <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Escrow Audit Desk</span>
                    <span className="font-label-lg text-label-lg font-bold text-primary font-mono">desk@escrow.cultivanode.ng</span>
                  </div>
                  <div className="flex items-center justify-between text-on-surface">
                    <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Dispute SLA Window</span>
                    <span className="font-label-sm text-label-sm font-semibold text-tertiary-container">Strict 48-Hour Guarantee</span>
                  </div>
                  <a className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-surface-container-highest text-on-surface font-label-lg text-label-lg hover:bg-surface-container transition-colors shadow-sm" href="#contact-inquiry-form"><Icon name="receipt_long" className="text-[18px]" /> File Mechanization Dispute</a>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-surface-container-high text-primary flex items-center justify-center mb-6">
                    <Icon name="account_balance" className="text-[26px]" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-label-sm bg-surface-container-highest text-on-surface uppercase">Institutional</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">CBN Settlement</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary mb-2">Institutional, Bank &amp; Partner Directorate</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">Dedicated channel for agricultural commercial lenders, Providus Bank and Wema Bank settlement reconciliations, state ministries, IITA, and NCRI agronomists.</p>
                </div>
                <div className="space-y-4 pt-4 bg-surface-container-low -mx-6 -mb-6 p-6 rounded-b-lg">
                  <div className="flex items-center justify-between text-on-surface">
                    <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Directorate Email</span>
                    <span className="font-label-lg text-label-lg font-bold text-primary font-mono">institutional@cultivanode.ng</span>
                  </div>
                  <div className="flex items-center justify-between text-on-surface">
                    <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Escrow Verification</span>
                    <span className="font-label-sm text-label-sm font-semibold text-secondary">Providus API Ready</span>
                  </div>
                  <a className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-surface-container-highest text-on-surface font-label-lg text-label-lg hover:bg-surface-container transition-colors shadow-sm" href="mailto:institutional@cultivanode.ng?subject=Institutional%20Partnership%20Inquiry"><Icon name="verified" className="text-[18px]" /> Contact Institutional Liaison</a>
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
                  <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-semibold">Incident &amp; Ticket Transmittal</span>
                  <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary mt-1 mb-4">Transmit a Verified Field Dossier</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-6">Submit your inquiry to trigger automatic geofenced dispatch. Tickets marked with urgent alerts directly page cluster extension officers and certified machinery operators on ground within 20 kilometers.</p>
                  <div className="bg-surface-container-low p-6 rounded-lg space-y-4 mb-6">
                    <h4 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2"><Icon name="security" className="text-secondary" /> Data Protection &amp; Escrow Governance</h4>
                    <ul className="space-y-3 font-body-sm text-body-sm text-on-surface-variant">
                      <li className="flex items-start gap-2.5">
                        <Icon name="check_circle" className="text-secondary text-[18px] shrink-0 mt-0.5" />
                        <span><strong>NDPA 2023 Compliant:</strong> Field photos and geocoordinates are encrypted and never disclosed to third parties without operational authorization.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Icon name="check_circle" className="text-secondary text-[18px] shrink-0 mt-0.5" />
                        <span><strong>Providus &amp; Wema Escrow Oversight:</strong> Mechanization and grain contract arbitration requests create auditable immutable audit trails.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Icon name="check_circle" className="text-secondary text-[18px] shrink-0 mt-0.5" />
                        <span><strong>Bilingual Operator Desks:</strong> Yorùbá voice memos submitted via WhatsApp are instantly linked to open ticket references.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-surface-container-lowest p-4 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-label-sm text-label-sm uppercase font-semibold text-on-surface-variant">Field Scouting Integration</span>
                      <span className="font-label-sm text-label-sm text-secondary bg-secondary-container px-2 py-0.5 rounded">GPS Enabled</span>
                    </div>
                    <div className="relative w-full h-44 rounded-lg overflow-hidden bg-surface-container">
                      <img className="w-full h-full object-cover" data-alt="Close up photograph of a cassava crop leaf inspected for mosaic disease in an agricultural testing field in Oyo State Nigeria under bright daylight, sharp high detail botanical agronomic imagery" src="/images/screens/e44c9db323b4.webp" alt="" loading="lazy" decoding="async" />
                      <div className="absolute bottom-2 left-2 right-2 bg-inverse-surface/80 backdrop-blur-sm text-inverse-on-surface px-3 py-1.5 rounded text-[11px] font-mono flex items-center justify-between">
                        <span>LAT 7.8540° N, LON 3.9312° E</span>
                        <span className="text-secondary-fixed">Oke-Ogun Hub Node</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-6">
                  <span className="font-label-sm text-label-sm text-on-surface-variant block">Need instant offline triage? Dial <a className="font-bold text-primary underline" href="tel:+2348002858482">+234 800-CULTIVA</a> or send an SMS with your farm corridor code.</span>
                </div>
              </div>
              {slot(slots, "form", (
                <div className="lg:col-span-7 bg-surface-container-lowest p-8 lg:p-10 rounded-lg shadow-sm">
                  <div className="space-y-6" id="public-support-ticket-form" role="form">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-sm text-label-sm text-on-surface font-semibold uppercase tracking-wider" htmlFor="fullName">Full Name / Enterprise Rep <span className="text-error">*</span></label>
                        <input className="h-10 px-3.5 rounded-lg bg-surface text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary" id="fullName" name="fullName" placeholder="e.g. Babatunde Adeleke" required type="text" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-sm text-label-sm text-on-surface font-semibold uppercase tracking-wider" htmlFor="phoneNumber">Phone (+234 WhatsApp Preferred) <span className="text-error">*</span></label>
                        <input className="h-10 px-3.5 rounded-lg bg-surface text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary" id="phoneNumber" name="phoneNumber" placeholder="+234 803 123 4567" required type="tel" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-sm text-label-sm text-on-surface font-semibold uppercase tracking-wider" htmlFor="emailAddress">Email Address <span className="text-error">*</span></label>
                        <input className="h-10 px-3.5 rounded-lg bg-surface text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary" id="emailAddress" name="emailAddress" placeholder="babatunde@farmgroup.ng" required type="email" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-sm text-label-sm text-on-surface font-semibold uppercase tracking-wider" htmlFor="categorySelector">Inquiry Category <span className="text-error">*</span></label>
                        <select defaultValue="" className="h-10 px-3.5 rounded-lg bg-surface text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer" id="categorySelector" name="categorySelector" required>
                          <option disabled value="">Select category...</option>
                          <option value="farmer_ops">Farmer Operational Support</option>
                          <option value="tractor_mechanization">Tractor Syndicate / Mechanization Booking</option>
                          <option value="input_marketplace">Input Dealer / Marketplace Vendor</option>
                          <option value="institutional_bank">Institutional / Bank Partnership</option>
                          <option value="ndpa_request">Statutory / NDPA Data Request</option>
                          <option value="general_inquiry">General Cluster Inquiry</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-sm text-label-sm text-on-surface font-semibold uppercase tracking-wider" htmlFor="corridorSelector">State / Agrarian Corridor <span className="text-error">*</span></label>
                      <select defaultValue="" className="h-10 px-3.5 rounded-lg bg-surface text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer" id="corridorSelector" name="corridorSelector" required>
                        <option disabled value="">Select corridor for geo-routing...</option>
                        <option value="oyo_okeogun">Oyo State - Oke-Ogun Maize &amp; Cassava Corridor (Saki, Iseyin)</option>
                        <option value="oyo_ibadan">Oyo State - Ibadan Agri-Central &amp; Ogbomoso</option>
                        <option value="ogun_egba">Ogun State - Egba/Yewa Agro-Forestry Belt (Abeokuta, Ilaro)</option>
                        <option value="osun_agro">Osun State - Agro-Valley Grain Cluster (Osogbo, Ilesa)</option>
                        <option value="ondo_cashcrop">Ondo State - Cash Crops &amp; Cocoa Syndicate (Akure, Ondo Town)</option>
                        <option value="ekiti_agri">Ekiti State - Upland Rice &amp; Cassava Hub (Ado-Ekiti)</option>
                        <option value="lagos_hub">Lagos Agri-Hub - Aggregation &amp; Epe Export Terminal</option>
                      </select>
                    </div>
                    <div className="p-4 rounded-lg bg-surface-container-low flex items-start gap-3">
                      <input className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer accent-primary" id="urgentPriorityToggle" name="urgentPriorityToggle" type="checkbox" />
                      <label className="cursor-pointer" htmlFor="urgentPriorityToggle">
                        <span className="font-label-md text-label-md text-on-surface font-bold flex items-center gap-1.5"><Icon name="warning" className="text-error text-[18px]" /> Urgent Priority Incident: Active field breakdown or pest outbreak</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant block mt-0.5">Triggers immediate SMS alerts to the local extension officer on patrol and moves ticket to the top of the queue.</span>
                      </label>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-sm text-label-sm text-on-surface font-semibold uppercase tracking-wider" htmlFor="fieldDossierDetails">Field Dossier Details / Operational Narrative <span className="text-error">*</span></label>
                      <textarea className="p-3.5 rounded-lg bg-surface text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary resize-y" id="fieldDossierDetails" name="fieldDossierDetails" placeholder="Detail crop type, affected hectares, machine booking ID (if applicable), or exact symptoms noticed..." required rows={4} />
                    </div>
                    <div className="p-4 rounded-lg bg-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-high text-primary flex items-center justify-center shrink-0">
                          <Icon name="add_photo_alternate" className="text-[20px]" />
                        </div>
                        <div>
                          <span className="font-label-sm text-label-sm font-semibold text-on-surface block">Optional Geotagged Photo or PDF</span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">PNG, JPG, or PDF up to 15MB. WhatsApp photos accepted.</span>
                        </div>
                      </div>
                      <label className="cursor-pointer shrink-0 px-4 py-2 rounded-lg bg-surface-container-lowest font-label-sm text-label-sm text-primary font-semibold hover:bg-surface-container transition-colors shadow-sm">Attach File <input accept="image/*,.pdf" className="hidden" type="file" /></label>
                    </div>
                    <div className="flex items-start gap-3">
                      <input className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer accent-primary" id="ndpaConsentCheckbox" name="ndpaConsentCheckbox" required type="checkbox" />
                      <label className="font-body-sm text-body-sm text-on-surface-variant cursor-pointer" htmlFor="ndpaConsentCheckbox">I hereby consent to CultivaNode collecting and processing this incident data according to the <strong className="text-on-surface">Nigeria Data Protection Act (NDPA 2023)</strong> and the terms detailed in the <Link className="text-primary underline font-semibold" href={`/${lang}/privacy`}>Privacy Policy</Link>.</label>
                    </div>
                    <div>
                      <button className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg font-bold hover:bg-primary transition-colors shadow-sm" id="submitTicketBtn" type="submit"><Icon name="send" className="text-[20px]" /> Transmit Verified Support Ticket</button>
                    </div>
                    <div className="hidden p-4 rounded-lg bg-secondary-container text-on-secondary-container" id="form-success-toast">
                      <div className="flex items-center gap-3">
                        <Icon name="check_circle" className="text-[24px] text-secondary" />
                        <div>
                          <p className="font-label-lg text-label-lg font-bold">Ticket Transmitted Successfully!</p>
                          <p className="font-body-sm text-body-sm">Reference Code: <span className="font-mono font-bold" id="ticket-ref-display">CN-2025-XXXX</span>. A regional field agronomist has been notified via WhatsApp telemetry.</p>
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
                <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-semibold">Physical Presence</span>
                <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary mt-1">Regional Cluster Stations &amp; Field HQs</h2>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">Walk into any accredited ADP partner node or mechanization station for face-to-face onboarding, machine inspections, and agronomist meetings.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-surface-container-lowest rounded-lg overflow-hidden shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-full h-40 bg-cover bg-center" data-location="Ibadan, Nigeria" style={{ backgroundImage: "url('/images/screens/c660aea6805c.webp')" }} />
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-label-sm bg-primary-container text-on-primary uppercase font-bold">Central HQ</span>
                      <span className="font-label-sm text-label-sm text-secondary font-medium">Open 07:30 - 18:00</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-primary mb-1">Ibadan Operational HQ</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">Agrarian Innovation Hub, Agodi GRA, Ibadan, Oyo State.</p>
                    <div className="space-y-2 pt-3 bg-surface-container-low -mx-6 px-6 py-4">
                      <div className="flex items-center gap-2 text-on-surface font-body-sm text-body-sm">
                        <Icon name="call" className="text-[18px] text-secondary" />
                        <span>+234 2 291 4080</span>
                      </div>
                      <div className="flex items-center gap-2 text-on-surface font-body-sm text-body-sm">
                        <Icon name="mail" className="text-[18px] text-secondary" />
                        <span className="font-mono text-[12px]">ibadan@cultivanode.ng</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-surface-container-low pt-0">
                  <a className="w-full py-2 px-3 rounded bg-surface-container-highest text-primary font-label-sm text-label-sm font-semibold flex items-center justify-center gap-1 hover:bg-surface-container transition-colors" href="https://maps.google.com" target="_blank" rel="noopener noreferrer"><Icon name="directions" className="text-[16px]" /> Get Directions</a>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-lg overflow-hidden shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-full h-40 bg-cover bg-center" data-location="Saki, Oyo State, Nigeria" style={{ backgroundImage: "url('/images/screens/8045f0484d54.webp')" }} />
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-label-sm bg-secondary-container text-on-secondary-container uppercase font-bold">Tractor Hub</span>
                      <span className="font-label-sm text-label-sm text-secondary font-medium">Open 06:00 - 19:00</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-primary mb-1">Oke-Ogun Mechanization Hub</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">Saki-Iseyin Agrarian Junction, Saki West LGA, Oyo State.</p>
                    <div className="space-y-2 pt-3 bg-surface-container-low -mx-6 px-6 py-4">
                      <div className="flex items-center gap-2 text-on-surface font-body-sm text-body-sm">
                        <Icon name="call" className="text-[18px] text-secondary" />
                        <span>+234 814 883 1920</span>
                      </div>
                      <div className="flex items-center gap-2 text-on-surface font-body-sm text-body-sm">
                        <Icon name="mail" className="text-[18px] text-secondary" />
                        <span className="font-mono text-[12px]">okeogun@cultivanode.ng</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-surface-container-low pt-0">
                  <a className="w-full py-2 px-3 rounded bg-surface-container-highest text-primary font-label-sm text-label-sm font-semibold flex items-center justify-center gap-1 hover:bg-surface-container transition-colors" href="https://maps.google.com" target="_blank" rel="noopener noreferrer"><Icon name="directions" className="text-[16px]" /> Get Directions</a>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-lg overflow-hidden shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-full h-40 bg-cover bg-center" data-location="Abeokuta, Nigeria" style={{ backgroundImage: "url('/images/screens/a060fb0f800a.webp')" }} />
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-label-sm bg-surface-container-high text-on-surface uppercase font-bold">OGADEP Office</span>
                      <span className="font-label-sm text-label-sm text-secondary font-medium">Open 08:00 - 17:00</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-primary mb-1">Ogun Agro-Forestry Liaison</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">OGADEP Complex, Idi-Aba, Abeokuta, Ogun State.</p>
                    <div className="space-y-2 pt-3 bg-surface-container-low -mx-6 px-6 py-4">
                      <div className="flex items-center gap-2 text-on-surface font-body-sm text-body-sm">
                        <Icon name="call" className="text-[18px] text-secondary" />
                        <span>+234 809 119 5541</span>
                      </div>
                      <div className="flex items-center gap-2 text-on-surface font-body-sm text-body-sm">
                        <Icon name="mail" className="text-[18px] text-secondary" />
                        <span className="font-mono text-[12px]">ogun@cultivanode.ng</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-surface-container-low pt-0">
                  <a className="w-full py-2 px-3 rounded bg-surface-container-highest text-primary font-label-sm text-label-sm font-semibold flex items-center justify-center gap-1 hover:bg-surface-container transition-colors" href="https://maps.google.com" target="_blank" rel="noopener noreferrer"><Icon name="directions" className="text-[16px]" /> Get Directions</a>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-lg overflow-hidden shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-full h-40 bg-cover bg-center" data-location="Akure, Ondo State, Nigeria" style={{ backgroundImage: "url('/images/screens/a7f557eb0b2a.webp')" }} />
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-label-sm bg-tertiary-fixed text-on-tertiary-fixed uppercase font-bold">Cocoa Belt</span>
                      <span className="font-label-sm text-label-sm text-secondary font-medium">Open 07:30 - 17:30</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-primary mb-1">Ondo Cash Crops Node</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">Alagbaka Government Reserve, Akure, Ondo State.</p>
                    <div className="space-y-2 pt-3 bg-surface-container-low -mx-6 px-6 py-4">
                      <div className="flex items-center gap-2 text-on-surface font-body-sm text-body-sm">
                        <Icon name="call" className="text-[18px] text-secondary" />
                        <span>+234 811 500 7733</span>
                      </div>
                      <div className="flex items-center gap-2 text-on-surface font-body-sm text-body-sm">
                        <Icon name="mail" className="text-[18px] text-secondary" />
                        <span className="font-mono text-[12px]">ondo@cultivanode.ng</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-surface-container-low pt-0">
                  <a className="w-full py-2 px-3 rounded bg-surface-container-highest text-primary font-label-sm text-label-sm font-semibold flex items-center justify-center gap-1 hover:bg-surface-container transition-colors" href="https://maps.google.com" target="_blank" rel="noopener noreferrer"><Icon name="directions" className="text-[16px]" /> Get Directions</a>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full bg-surface px-6 lg:px-12 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-semibold">Immediate Clarity</span>
              <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary mt-1">Frequently Answered Liaison Inquiries</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">Clear procedural guidelines on field arrival times, tractor disputes, and multilingual agronomic dispatch.</p>
            </div>
            <div className="space-y-4">
              <details className="bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden faq-item group">
                <summary className="w-full flex items-center justify-between p-6 text-left focus:outline-none hover:bg-surface-container-low transition-colors list-none [&::-webkit-details-marker]:hidden">
                  <span className="font-headline-sm text-headline-sm text-primary font-semibold pr-4">How quickly does a field extension officer respond to crop emergencies?</span>
                  <Icon name="expand_more" className="text-primary text-[24px] transform transition-transform duration-200 faq-icon group-open:rotate-180" />
                </summary>
                <div className="faq-content px-6 pb-6 pt-0 bg-surface-container-lowest">
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">When an urgent priority incident is flagged through the portal or hotline, our geofenced telemetry alerts the closest accredited Agricultural Development Programme (ADP) extension officer within 20 km. Our current average physical on-farm response window across Oyo (Oke-Ogun), Ogun, and Ondo clusters is <strong>18 to 45 minutes</strong> during daylight operating hours (06:30 - 18:30 WAT).</p>
                </div>
              </details>
              <details className="bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden faq-item group">
                <summary className="w-full flex items-center justify-between p-6 text-left focus:outline-none hover:bg-surface-container-low transition-colors list-none [&::-webkit-details-marker]:hidden">
                  <span className="font-headline-sm text-headline-sm text-primary font-semibold pr-4">Who do I call if my hired tractor doesn&apos;t arrive on the booking date?</span>
                  <Icon name="expand_more" className="text-primary text-[24px] transform transition-transform duration-200 faq-icon group-open:rotate-180" />
                </summary>
                <div className="faq-content px-6 pb-6 pt-0 bg-surface-container-lowest">
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">Contact our <strong>Escrow &amp; Mechanization Desk immediately at +234 800-CULTIVA (Option 2)</strong> or select &apos;Tractor Syndicate / Mechanization&apos; in the form above. Under CultivaNode escrow protocols backed by Providus Bank and Wema Bank, your payment is held securely in escrow until the operator GPS checks in at your farm coordinates. If mobilization fails within 4 hours of the scheduled time without severe weather justification, we auto-reassign a nearby standby tractor or release 100% of your funds within 48 hours.</p>
                </div>
              </details>
              <details className="bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden faq-item group">
                <summary className="w-full flex items-center justify-between p-6 text-left focus:outline-none hover:bg-surface-container-low transition-colors list-none [&::-webkit-details-marker]:hidden">
                  <span className="font-headline-sm text-headline-sm text-primary font-semibold pr-4">Can I submit pest photos directly via WhatsApp in Yorùbá?</span>
                  <Icon name="expand_more" className="text-primary text-[24px] transform transition-transform duration-200 faq-icon group-open:rotate-180" />
                </summary>
                <div className="faq-content px-6 pb-6 pt-0 bg-surface-container-lowest">
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed"><strong>Bẹ́ẹ̀ni (Yes).</strong> Our WhatsApp Agronomy Desk (+234 800-CULTIVA) supports voice notes, video clips, and high-resolution imagery in standard Yorùbá, Nigerian Pidgin, and English. Our regional agronomists transcribe and log the audio into our incident management database, returning diagnostic advice and recommended spraying windows directly via WhatsApp audio voice notes.</p>
                </div>
              </details>
              <details className="bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden faq-item group">
                <summary className="w-full flex items-center justify-between p-6 text-left focus:outline-none hover:bg-surface-container-low transition-colors list-none [&::-webkit-details-marker]:hidden">
                  <span className="font-headline-sm text-headline-sm text-primary font-semibold pr-4">How does CultivaNode comply with the Nigeria Data Protection Act (NDPA 2023)?</span>
                  <Icon name="expand_more" className="text-primary text-[24px] transform transition-transform duration-200 faq-icon group-open:rotate-180" />
                </summary>
                <div className="faq-content px-6 pb-6 pt-0 bg-surface-container-lowest">
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">All farmer cluster rosters, contact details, land polygon boundaries, and escrow banking tokens are encrypted under strict NDPA 2023 regulations. We do not sell or monetize farm-level agronomic data to private third-party marketing entities. Field officers only view farm details necessary to execute direct mechanization or extension visits.</p>
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
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-on-secondary font-label-sm text-label-sm mb-4"><span className="w-2 h-2 rounded-full bg-secondary-container animate-ping" /> Critical Cluster Incident Alert</div>
                <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-primary font-bold mb-3">Facing an active armyworm invasion, blight outbreak, or stranded machinery?</h2>
                <p className="font-body-md text-body-md text-on-primary-container max-w-xl">Do not wait for formal tickets. Dial our priority agronomist dispatch desk immediately or ping the emergency WhatsApp hotline with your GPS coordinates.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0 w-full lg:w-auto">
                <a className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-lg bg-surface-container-lowest text-primary font-label-lg text-label-lg font-bold hover:bg-surface-container-low transition-colors shadow-md text-center" href="tel:+2348002858482"><Icon name="phone_in_talk" className="text-[22px] text-primary" /> Call +234 800-CULTIVA</a>
                <a className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-lg bg-secondary text-on-secondary font-label-lg text-label-lg font-bold hover:bg-secondary/90 transition-colors shadow-md text-center" href="https://wa.me/2348002858482?text=EMERGENCY%3A%20Urgent%20Field%20Outbreak" target="_blank" rel="noopener noreferrer"><Icon name="emergency_home" className="text-[22px]" /> Emergency WhatsApp Dispatch</a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
