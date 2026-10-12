"use client";

// Ported from the "join_the_south_west_pilot_cultivanode_agrarian_mesh" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import { slot, type ScreenProps } from "./types";
import { showScreenToast } from "@/components/screens/screen-toast";

export type PilotPageSlot = "form";

export function PilotPage({ lang = "en", slots }: ScreenProps<PilotPageSlot>) {
  const [selectedRole, setSelectedRole] = useState("Smallholder Farmer");
  const [selectedState, setSelectedState] = useState("Oyo");
  const [submitted, setSubmitted] = useState(false);

  const handleRoleSelect = (role: string, label: string) => {
    setSelectedRole(role);
    showScreenToast("Pilot Cohort Selected", `Assigned role set to: ${label}. Enrollment form updated.`);
    const el = document.getElementById("enrollment-form");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    showScreenToast("Enrollment Dossier Transmitted", "Dossier ref CN-SW-2025-9941 registered. ADP field officer will contact you within 24-72 hours.");
  };
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <div className="w-full bg-surface-container-low py-3">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-wrap items-center justify-between gap-4">
            <nav className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant">
              <Link className="hover:text-primary transition-colors flex items-center gap-1.5" href={`/${lang}`}>
                <Icon name="hub" className="text-[16px]" />
                <span>Pilot Expansion</span>
              </Link>
              <span className="text-outline-variant">/</span>
              <span className="text-on-surface-variant">South-West Agrarian Pilot</span>
              <span className="text-outline-variant">/</span>
              <span className="text-primary font-semibold">Apply &amp; Enroll</span>
            </nav>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm"><span className="w-1.5 h-1.5 rounded-full bg-secondary mr-1.5 animate-pulse" />Phase 1 Cohort Open</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Ref: CN-SW-PILOT-2025</span>
            </div>
          </div>
        </div>
        <section className="w-full bg-surface-container-lowest py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded bg-surface-container text-primary font-label-sm text-label-sm">
                  <Icon name="travel_explore" className="text-[18px]" />
                  <span>Document 2 §4.18 Implementation • Master Build Plan</span>
                </div>
                <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl lg:text-[2.75rem] lg:leading-[3.25rem] text-on-surface tracking-tight font-bold">Join the South-West Agrarian Pilot Mesh</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">Enroll your farm, tractor syndicate, or agro-dealership into the Phase 1 operational pilot across Oyo, Ogun, Ondo, Osun, Ekiti, and Lagos. Benefit from 0% platform booking commission, verified PostGIS boundary mapping, and secured CBN partner escrow.</p>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <a className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg shadow-sm hover:bg-primary transition-all" href="#enrollment-form">
                    <Icon name="assignment_add" className="text-[20px]" />
                    <span>Submit Pilot Application</span>
                  </a>
                  <a className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg bg-surface-container-low text-on-surface font-label-lg text-label-lg hover:bg-surface-container transition-all" href="/api/documents/handbook?download=1">
                    <Icon name="download" className="text-[20px] text-primary" />
                    <span>Participant Handbook (PDF)</span>
                  </a>
                </div>
              </div>
              <div className="lg:col-span-4 bg-surface-container-low rounded-xl p-6 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-2">
                    <Icon name="verified_user" className="text-primary text-[22px]" />
                    <span className="font-label-lg text-label-lg text-on-surface">Escrow Framework</span>
                  </div>
                  <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-highest text-primary font-semibold">Tier-1 Rail</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Settlement conduits structured under Providus Bank PLC and Wema Bank ALAT infrastructure. Zero fund commingling, NDPA 2023 certified biometrics.</p>
                <div className="bg-surface-container-lowest rounded-lg p-3.5 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>PostGIS Spatial Tolerance:</span>
                    <span className="font-semibold text-on-surface">Sub-meter GPS</span>
                  </div>
                  <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>Offline Edge Relay:</span>
                    <span className="font-semibold text-secondary">PowerSync Ready</span>
                  </div>
                  <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>Phase Period:</span>
                    <span className="font-semibold text-on-surface">Q1 - Q3 2025</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm pt-1">
                  <Icon name="security" className="text-[18px] text-secondary" />
                  <span>Audited &amp; NDPA 2023 Compliant</span>
                </div>
              </div>
            </div>
            <div className="mt-12 bg-surface-container rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Live Quota Allocation Tracker • SW Pilot Zone</span>
                </div>
                <span className="font-label-sm text-label-sm text-primary font-semibold">Updated 14 mins ago</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-surface-container-lowest rounded-lg p-5 shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Smallholders</span>
                    <span className="p-1 rounded bg-surface-container text-primary">
                      <Icon name="agriculture" className="text-[18px]" />
                    </span>
                  </div>
                  <div className="my-3">
                    <div className="flex items-baseline gap-2">
                      <span className="font-metric-num text-metric-num text-on-surface font-bold">248</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">/ 300 Target</span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden mt-2">
                      <div className="bg-primary h-full rounded-full" style={{ width: "82.6%" }} />
                    </div>
                  </div>
                  <div className="flex justify-between font-label-sm text-label-sm text-secondary font-semibold">
                    <span>82.6% Capacity</span>
                    <span>52 slots left</span>
                  </div>
                </div>
                <div className="bg-surface-container-lowest rounded-lg p-5 shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Machinery Syndicates</span>
                    <span className="p-1 rounded bg-surface-container text-primary">
                      <Icon name="precision_manufacturing" className="text-[18px]" />
                    </span>
                  </div>
                  <div className="my-3">
                    <div className="flex items-baseline gap-2">
                      <span className="font-metric-num text-metric-num text-on-surface font-bold">22</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">/ 30 Verified</span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden mt-2">
                      <div className="bg-secondary h-full rounded-full" style={{ width: "73.3%" }} />
                    </div>
                  </div>
                  <div className="flex justify-between font-label-sm text-label-sm text-secondary font-semibold">
                    <span>73.3% Deployed</span>
                    <span>8 syndicates left</span>
                  </div>
                </div>
                <div className="bg-surface-container-lowest rounded-lg p-5 shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Agro Service Providers</span>
                    <span className="p-1 rounded bg-surface-container text-primary">
                      <Icon name="engineering" className="text-[18px]" />
                    </span>
                  </div>
                  <div className="my-3">
                    <div className="flex items-baseline gap-2">
                      <span className="font-metric-num text-metric-num text-on-surface font-bold">44</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">/ 60 Ready</span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden mt-2">
                      <div className="bg-primary-container h-full rounded-full" style={{ width: "73.3%" }} />
                    </div>
                  </div>
                  <div className="flex justify-between font-label-sm text-label-sm text-secondary font-semibold">
                    <span>Calibrated Gangs</span>
                    <span>16 slots open</span>
                  </div>
                </div>
                <div className="bg-primary text-on-primary rounded-lg p-5 shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="font-label-sm text-label-sm text-on-primary/80 uppercase">Commission Overhead</span>
                    <span className="p-1 rounded bg-primary-container text-on-primary">
                      <Icon name="percent" className="text-[18px]" />
                    </span>
                  </div>
                  <div className="my-3">
                    <div className="flex items-baseline gap-1">
                      <span className="font-metric-num text-metric-num text-on-primary font-bold">₦0</span>
                      <span className="font-label-sm text-label-sm text-on-primary/70">Commission Fee</span>
                    </div>
                    <p className="font-label-sm text-label-sm text-on-primary/80 mt-2">Subsidized by 2025 Agrarian Mesh Inception Grant. 0% transaction cut.</p>
                  </div>
                  <div className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary-container font-semibold">
                    <Icon name="check_circle" className="text-[16px]" />
                    <span>Guaranteed for Phase 1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-16 bg-surface">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest font-bold">Section 4.18 Architecture</span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold mt-1">Eligible Participant Categories</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-xl">Select your primary operational profile to inspect designated mesh entitlements, geospatial dispatch rules, and settlement criteria.</p>
              </div>
              <div className="text-right hidden md:block">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Standardized ADP Protocols Applied</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-5 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                    <Icon name="potted_plant" className="text-[26px]" />
                  </div>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider">Cohort A • Production</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1 mb-2">Smallholder &amp; Commercial Farmer</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-4">Cultivating 1 to 50+ Hectares of White Maize (SAMMAZ-15), Industrial Cassava (TME-419), Yam, Rice, or Horticultural Vegetables in SW states.</p>
                  <div className="bg-surface-container-low rounded-lg p-3 flex flex-col gap-2 mb-4">
                    <div className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface">
                      <Icon name="check" className="text-secondary text-[18px] shrink-0 mt-0.5" />
                      <span>Free PostGIS cadastral boundary mapping &amp; shapefile creation</span>
                    </div>
                    <div className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface">
                      <Icon name="check" className="text-secondary text-[18px] shrink-0 mt-0.5" />
                      <span>Subsidized tractor syndicate pooling (≤15km radius)</span>
                    </div>
                    <div className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface">
                      <Icon name="check" className="text-secondary text-[18px] shrink-0 mt-0.5" />
                      <span>Pre-vetted institutional off-take agreements</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleRoleSelect("Smallholder Farmer", "Smallholder Farmer")} className="w-full py-2.5 px-3 rounded-lg bg-surface-container text-primary hover:bg-primary hover:text-on-primary font-label-md text-label-md transition-colors text-center" type="button">Select This Role →</button>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-5 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                    <Icon name="front_loader" className="text-[26px]" />
                  </div>
                  <span className="font-label-sm text-label-sm text-tertiary-container font-semibold uppercase tracking-wider">Cohort B • Mechanization</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1 mb-2">Tractor &amp; Machinery Syndicate</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-4">Fleet owners and leasing syndicates controlling 4WD tractors (65HP-120HP), self-propelled boom sprayers, or multi-crop combine harvesters.</p>
                  <div className="bg-surface-container-low rounded-lg p-3 flex flex-col gap-2 mb-4">
                    <div className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface">
                      <Icon name="check" className="text-secondary text-[18px] shrink-0 mt-0.5" />
                      <span>Zero idle deadhead transit via spatial corridor clustering</span>
                    </div>
                    <div className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface">
                      <Icon name="check" className="text-secondary text-[18px] shrink-0 mt-0.5" />
                      <span>Escrow locked payout within 24h of field sign-off</span>
                    </div>
                    <div className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface">
                      <Icon name="check" className="text-secondary text-[18px] shrink-0 mt-0.5" />
                      <span>0% platform commission through pilot year</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleRoleSelect("Tractor Syndicate Owner", "Tractor & Machinery Syndicate")} className="w-full py-2.5 px-3 rounded-lg bg-surface-container text-primary hover:bg-primary hover:text-on-primary font-label-md text-label-md transition-colors text-center" type="button">Select This Role →</button>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-5 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                    <Icon name="badge" className="text-[26px]" />
                  </div>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider">Cohort C • Field Services</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1 mb-2">Skilled Agro-Operator &amp; Sprayer</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-4">Calibrated backpack spray teams, tractor drivers, pruning gangs, soil sampling scouts, and harvest logistics operators in rural clusters.</p>
                  <div className="bg-surface-container-low rounded-lg p-3 flex flex-col gap-2 mb-4">
                    <div className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface">
                      <Icon name="check" className="text-secondary text-[18px] shrink-0 mt-0.5" />
                      <span>ADP accredited safety credentialing &amp; PPE provisioning</span>
                    </div>
                    <div className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface">
                      <Icon name="check" className="text-secondary text-[18px] shrink-0 mt-0.5" />
                      <span>Automated SMS task dispatch within assigned clusters</span>
                    </div>
                    <div className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface">
                      <Icon name="check" className="text-secondary text-[18px] shrink-0 mt-0.5" />
                      <span>Direct wallet disbursements via Wema ALAT / Providus</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleRoleSelect("Agro-Operator / Sprayer", "Skilled Agro-Operator & Sprayer")} className="w-full py-2.5 px-3 rounded-lg bg-surface-container text-primary hover:bg-primary hover:text-on-primary font-label-md text-label-md transition-colors text-center" type="button">Select This Role →</button>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-5 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                    <Icon name="storefront" className="text-[26px]" />
                  </div>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider">Cohort D • Input Channel</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1 mb-2">Input Merchant &amp; Agro-Dealer</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-4">Authorized distributors of certified grain seed varieties, NPK/Urea fertilizers, biological crop protection agents, and storage bags.</p>
                  <div className="bg-surface-container-low rounded-lg p-3 flex flex-col gap-2 mb-4">
                    <div className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface">
                      <Icon name="check" className="text-secondary text-[18px] shrink-0 mt-0.5" />
                      <span>Direct linkage to verified crop phenology calendars</span>
                    </div>
                    <div className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface">
                      <Icon name="check" className="text-secondary text-[18px] shrink-0 mt-0.5" />
                      <span>Tamper-evident batch QR vouchers and inventory escrow</span>
                    </div>
                    <div className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface">
                      <Icon name="check" className="text-secondary text-[18px] shrink-0 mt-0.5" />
                      <span>Bulk aggregation orders without counterparty payment default</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleRoleSelect("Input Merchant / Agro-Dealer", "Input Merchant & Agro-Dealer")} className="w-full py-2.5 px-3 rounded-lg bg-surface-container text-primary hover:bg-primary hover:text-on-primary font-label-md text-label-md transition-colors text-center" type="button">Select This Role →</button>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-16 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">Geographic Distribution</span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold mt-1">Pilot Geographic Clusters &amp; Corridors</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-2xl">CultivaNode operates regional dispatch nodes anchored at existing Agricultural Development Project (ADP) centers to guarantee local field agent presence and tractor stationing.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded bg-surface-container-highest text-on-surface font-label-sm text-label-sm"><Icon name="satellite_alt" className="text-[16px] mr-1 text-primary" /> Sentinel-2 • 10m Ground Resolution</span>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-secondary" />
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">Cluster 01: Oke-Ogun Grain Corridor</span>
                    </div>
                    <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold">Active Mesh</span>
                  </div>
                  <div className="w-full h-48 bg-cover bg-center rounded-lg relative overflow-hidden mb-5 shadow-sm" data-location="Saki West, Oyo State, Nigeria" style={{ backgroundImage: "url('/images/screens/ecc4c6e4275d.webp')" }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex items-end p-4">
                      <div className="text-on-primary">
                        <div className="font-label-sm text-label-sm uppercase tracking-wider opacity-90">Agro-Ecological Zone</div>
                        <div className="font-headline-sm text-headline-sm font-bold">Derived Guinea Savanna</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-surface-container-low rounded-lg p-3">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Target LGAs</span>
                      <p className="font-label-md text-label-md text-on-surface mt-1 font-semibold">Saki West, Iseyin, Kisi (Oyo State)</p>
                    </div>
                    <div className="bg-surface-container-low rounded-lg p-3">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Agronomic Priority</span>
                      <p className="font-label-md text-label-md text-on-surface mt-1 font-semibold">SAMMAZ-15 White Maize, Industrial Cassava</p>
                    </div>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-4">Anchored via the Saki ADP Depot. Designed for continuous mechanized tillage and rapid drone spraying across wide, contiguous savanna plots.</p>
                </div>
                <div className="pt-4 flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                  <span className="flex items-center gap-1.5"><Icon name="local_shipping" className="text-[16px] text-primary" /> 12 Tractors Mobilized</span>
                  <span className="font-semibold text-primary">78 Enrolled Farmers</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-secondary" />
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">Cluster 02: Ogun Agro-Forestry &amp; Cassava Belt</span>
                    </div>
                    <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold">Active Mesh</span>
                  </div>
                  <div className="w-full h-48 bg-cover bg-center rounded-lg relative overflow-hidden mb-5 shadow-sm" data-location="Abeokuta North, Ogun State, Nigeria" style={{ backgroundImage: "url('/images/screens/08dd797cb381.webp')" }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex items-end p-4">
                      <div className="text-on-primary">
                        <div className="font-label-sm text-label-sm uppercase tracking-wider opacity-90">Agro-Ecological Zone</div>
                        <div className="font-headline-sm text-headline-sm font-bold">Rainforest Lowlands</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-surface-container-low rounded-lg p-3">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Target LGAs</span>
                      <p className="font-label-md text-label-md text-on-surface mt-1 font-semibold">Abeokuta North, Sagamu, Ijebu-Ode</p>
                    </div>
                    <div className="bg-surface-container-low rounded-lg p-3">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Agronomic Priority</span>
                      <p className="font-label-md text-label-md text-on-surface mt-1 font-semibold">TME-419 Cassava, Fresh Veg, Mechanization</p>
                    </div>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-4">Proximity link to industrial starch processors and Lagos consumer freight corridors. Direct integration with Ogun State Agricultural Development Programme (OGADEP).</p>
                </div>
                <div className="pt-4 flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                  <span className="flex items-center gap-1.5"><Icon name="local_shipping" className="text-[16px] text-primary" /> 6 Tractors Mobilized</span>
                  <span className="font-semibold text-primary">64 Enrolled Farmers</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-secondary" />
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">Cluster 03: Osun Agro-Valley Hub</span>
                    </div>
                    <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface font-semibold">Deploying</span>
                  </div>
                  <div className="w-full h-48 bg-cover bg-center rounded-lg relative overflow-hidden mb-5 shadow-sm" data-location="Osogbo, Osun State, Nigeria" style={{ backgroundImage: "url('/images/screens/bca1c5f6d8a8.webp')" }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex items-end p-4">
                      <div className="text-on-primary">
                        <div className="font-label-sm text-label-sm uppercase tracking-wider opacity-90">Agro-Ecological Zone</div>
                        <div className="font-headline-sm text-headline-sm font-bold">Transitional River Basin</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-surface-container-low rounded-lg p-3">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Target LGAs</span>
                      <p className="font-label-md text-label-md text-on-surface mt-1 font-semibold">Osogbo, Ejigbo, Ede North/South</p>
                    </div>
                    <div className="bg-surface-container-low rounded-lg p-3">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Agronomic Priority</span>
                      <p className="font-label-md text-label-md text-on-surface mt-1 font-semibold">Mixed Horticultural, Grain &amp; Organic Veg</p>
                    </div>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-4">Focusing on high-value vegetable clusters and irrigation-supported grains along the Osun River basin with rapid cold chain consolidation.</p>
                </div>
                <div className="pt-4 flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                  <span className="flex items-center gap-1.5"><Icon name="local_shipping" className="text-[16px] text-primary" /> 4 Tractors Mobilized</span>
                  <span className="font-semibold text-primary">52 Enrolled Farmers</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-secondary" />
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">Cluster 04: Ondo Central &amp; Cash Crops</span>
                    </div>
                    <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold">Active Mesh</span>
                  </div>
                  <div className="w-full h-48 bg-cover bg-center rounded-lg relative overflow-hidden mb-5 shadow-sm" data-location="Akure, Ondo State, Nigeria" style={{ backgroundImage: "url('/images/screens/c8709d2eeb73.webp')" }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex items-end p-4">
                      <div className="text-on-primary">
                        <div className="font-label-sm text-label-sm uppercase tracking-wider opacity-90">Agro-Ecological Zone</div>
                        <div className="font-headline-sm text-headline-sm font-bold">High Precipitation Rainforest</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-surface-container-low rounded-lg p-3">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Target LGAs</span>
                      <p className="font-label-md text-label-md text-on-surface mt-1 font-semibold">Akure South/North, Owo, Ondo City</p>
                    </div>
                    <div className="bg-surface-container-low rounded-lg p-3">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Agronomic Priority</span>
                      <p className="font-label-md text-label-md text-on-surface mt-1 font-semibold">Cocoa Agroforestry, Oil Palm, Understory Cassava</p>
                    </div>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-4">Integration of calibrated boom sprayers for black-pod disease mitigation, post-harvest drying telemetry, and premium European export traceability.</p>
                </div>
                <div className="pt-4 flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                  <span className="flex items-center gap-1.5"><Icon name="local_shipping" className="text-[16px] text-primary" /> Drone Sprayer Fleets Active</span>
                  <span className="font-semibold text-primary">54 Enrolled Farmers</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-16 bg-surface">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest font-bold">Systematic Verification Cycle</span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold mt-1">What Happens After You Apply</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">From digital intake to on-farm equipment dispatch, the CultivaNode onboarding framework adheres to stringent cryptographic integrity and physical ground truth.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg font-black text-on-surface select-none">01</div>
                <div>
                  <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-label-lg mb-4">1</div>
                  <span className="inline-block px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-primary font-semibold mb-2">Within 24 Hours</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-2">Digital Dossier Review &amp; NIN Match</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Automated telecom HLR lookup and National Identification Number (NIN) KYC matching via secure government-accredited verification APIs.</p>
                </div>
                <div className="pt-4 flex items-center gap-1.5 font-label-sm text-label-sm text-secondary">
                  <Icon name="verified" className="text-[16px]" />
                  <span>Zero Paperwork Intake</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg font-black text-on-surface select-none">02</div>
                <div>
                  <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-label-lg mb-4">2</div>
                  <span className="inline-block px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-primary font-semibold mb-2">Within 3 Business Days</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-2">Cadastral Boundary GPS Walk</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">An accredited state ADP extension officer visits your farm. Using the mobile field app, they record GPS vertexes to generate an immutable PostGIS polygon.</p>
                </div>
                <div className="pt-4 flex items-center gap-1.5 font-label-sm text-label-sm text-secondary">
                  <Icon name="satellite" className="text-[16px]" />
                  <span>Polygon NDVI Registered</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg font-black text-on-surface select-none">03</div>
                <div>
                  <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-label-lg mb-4">3</div>
                  <span className="inline-block px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-primary font-semibold mb-2">Within 5 Business Days</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-2">Cluster Matching &amp; Pre-Booking</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">The spatial dispatch engine pairs your farm with machinery syndicates and spray squads stationed within a 15-kilometer operational radius.</p>
                </div>
                <div className="pt-4 flex items-center gap-1.5 font-label-sm text-label-sm text-secondary">
                  <Icon name="near_me" className="text-[16px]" />
                  <span>≤15km Proximity Lock</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg font-black text-on-surface select-none">04</div>
                <div>
                  <div className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-label-lg mb-4">4</div>
                  <span className="inline-block px-2 py-0.5 rounded bg-secondary-container font-label-sm text-label-sm text-on-secondary-container font-semibold mb-2">Go-Live Activated</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-2">Escrow Integration &amp; NDPA Lock</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Your designated settlement wallet is bound to Providus/Wema escrow rails. Booking orders, tractor mobilizations, and inputs proceed seamlessly.</p>
                </div>
                <div className="pt-4 flex items-center gap-1.5 font-label-sm text-label-sm text-secondary">
                  <Icon name="lock" className="text-[16px]" />
                  <span>NDPA 2023 Shield Activated</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-16 bg-surface-container-low" id="enrollment-form">
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <div className="bg-surface-container-lowest rounded-2xl shadow-md p-8 lg:p-12">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 mb-8">
                <div>
                  <div className="inline-flex items-center gap-1.5 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">
                    <Icon name="how_to_reg" className="text-[16px]" />
                    <span>Intake Form • Document 2 §4.18</span>
                  </div>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold mt-1">Submit Pilot Enrollment Dossier</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Field verification agents are dispatched on a strict chronological intake quota.</p>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm flex items-center gap-2 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <span>Server Time: GMT+1 (WAT)</span>
                </div>
              </div>
              {slot(slots, "form", (
                <div className="space-y-8" id="pilotForm" role="form">
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-surface-container text-primary flex items-center justify-center font-label-sm text-label-sm font-bold">1</span>
                      <span>Primary Representative Credentials</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block font-label-md text-label-md text-on-surface font-semibold mb-2" htmlFor="fullName">Full Name (as per NIN) <span className="text-error">*</span></label>
                        <input className="w-full h-10 px-3.5 bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" id="fullName" placeholder="e.g. Babatunde Olawale Adeleke" required type="text" />
                      </div>
                      <div>
                        <label className="block font-label-md text-label-md text-on-surface font-semibold mb-2" htmlFor="phoneNumber">WhatsApp / Phone (+234) <span className="text-error">*</span></label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant font-label-md text-label-md">+234</div>
                          <input className="w-full h-10 pl-14 pr-3 bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" id="phoneNumber" placeholder="803 123 4567" required type="tel" />
                        </div>
                      </div>
                      <div>
                        <label className="block font-label-md text-label-md text-on-surface font-semibold mb-2" htmlFor="emailAddress">Email Address <span className="text-on-surface-variant font-normal">(Optional)</span></label>
                        <input className="w-full h-10 px-3.5 bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" id="emailAddress" placeholder="babatunde@farmenterprise.ng" type="email" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-surface-container text-primary flex items-center justify-center font-label-sm text-label-sm font-bold">2</span>
                      <span>Mesh Role &amp; Agronomic Classification</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block font-label-md text-label-md text-on-surface font-semibold mb-2" htmlFor="participantRole">Participant Role <span className="text-error">*</span></label>
                        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="w-full h-10 px-3 bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" id="participantRole" required>
                          <option disabled value="">Select category...</option>
                          <option value="Smallholder Farmer">Smallholder Farmer (1-10 Ha)</option>
                          <option value="Commercial Farmer">Commercial Agro-Enterprise (10-50+ Ha)</option>
                          <option value="Tractor Syndicate Owner">Tractor &amp; Machinery Syndicate Owner</option>
                          <option value="Agro-Operator / Sprayer">Certified Agro-Operator / Sprayer Gang</option>
                          <option value="Input Merchant / Agro-Dealer">Input Merchant / Agro-Dealer</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-label-md text-label-md text-on-surface font-semibold mb-2" htmlFor="targetState">Target State <span className="text-error">*</span></label>
                        <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="w-full h-10 px-3 bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" id="targetState" required>
                          <option disabled value="">Select South-West State...</option>
                          <option value="Oyo">Oyo State</option>
                          <option value="Ogun">Ogun State</option>
                          <option value="Ondo">Ondo State</option>
                          <option value="Osun">Osun State</option>
                          <option value="Ekiti">Ekiti State</option>
                          <option value="Lagos">Lagos State</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-label-md text-label-md text-on-surface font-semibold mb-2" htmlFor="targetLga">Local Govt Area (LGA) <span className="text-error">*</span></label>
                        <select defaultValue="" className="w-full h-10 px-3 bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" id="targetLga" required>
                          <option disabled value="">Select State first...</option>
                          <option value="Ibadan North">Ibadan North</option>
                          <option value="Ibarapa Central">Ibarapa Central</option>
                          <option value="Oyo West">Oyo West</option>
                          <option value="Saki West">Saki West</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-surface-container text-primary flex items-center justify-center font-label-sm text-label-sm font-bold">3</span>
                      <span>Farm Capacity / Machinery Inventory</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block font-label-md text-label-md text-on-surface font-semibold mb-2" htmlFor="landSize">Farm Size (Hectares) or Equipment Count <span className="text-error">*</span></label>
                        <input className="w-full h-10 px-3.5 bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" id="landSize" min="0.5" placeholder="e.g. 12.5 (Ha) or 2 (Tractors)" required step="0.5" type="number" />
                      </div>
                      <div>
                        <label className="block font-label-md text-label-md text-on-surface font-semibold mb-2" htmlFor="primaryCrops">Primary Crops Cultivated / Machinery Specs <span className="text-error">*</span></label>
                        <input className="w-full h-10 px-3.5 bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" id="primaryCrops" placeholder="e.g. Cassava (TME-419), White Maize, or Massey Ferguson 75HP" required type="text" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-surface-container-low rounded-xl p-5 space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary" required type="checkbox" />
                      <span className="font-body-sm text-body-sm text-on-surface"><strong>Nigeria Data Protection Act (NDPA 2023) Consent:</strong> I authorize CultivaNode and state Agricultural Development Project (ADP) enumerators to collect cadastral GPS boundary coordinates, phone records, and agronomic yield telemetry strictly for pilot mesh dispatch.</span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary" required type="checkbox" />
                      <span className="font-body-sm text-body-sm text-on-surface"><strong>Phase 1 Operational Terms:</strong> I acknowledge that platform fees are waived at ₦0 commission throughout 2025, and that equipment dispatch agreements will settle through designated Providus Bank / Wema Bank escrow accounts upon digital completion sign-off.</span>
                    </label>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                    <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
                      <Icon name="lock" className="text-secondary text-[18px]" />
                      <span>Encrypted 256-bit TLS Gateway • Instant SMS Confirmation</span>
                    </div>
                    <button onClick={handleSubmit} className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-primary-container text-on-primary hover:bg-primary font-label-lg text-label-lg shadow-sm transition-all flex items-center justify-center gap-2" id="submitButton" type="submit">
                      <Icon name="send" className="text-[20px]" />
                      <span>Submit Pilot Enrollment Dossier</span>
                    </button>
                  </div>
                  <div className={`${submitted ? "block" : "hidden"} rounded-xl p-5 bg-secondary-container text-on-secondary-container`} id="submissionAlert">
                    <div className="flex items-start gap-3">
                      <Icon name="task_alt" className="text-[24px] text-secondary" />
                      <div>
                        <h4 className="font-headline-sm text-headline-sm font-bold">Enrollment Dossier Successfully Transmitted!</h4>
                        <p className="font-body-sm text-body-sm mt-1">Your reference identifier is <strong id="dossierId">CN-SW-2025-9941</strong>. An SMS confirmation has been dispatched. An ADP field officer in your target LGA will contact you within 24 to 72 hours for the GPS cadastral boundary walk.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="w-full py-16 bg-surface">
          <div className="max-w-4xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-12">
              <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest font-bold">Frequently Addressed Inquiries</span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold mt-1">Pilot Guarantees &amp; FAQ</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">Clear answers regarding platform fees, rural offline connectivity, and partner escrow protocols.</p>
            </div>
            <div className="space-y-4">
              <details className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden group">
                <summary className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-headline-sm text-headline-sm text-on-surface font-semibold hover:bg-surface-container-low transition-colors list-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-3">
                    <Icon name="payments" className="text-secondary text-[22px]" />
                    <span>Are there any hidden fees or commissions during the pilot?</span>
                  </span>
                  <Icon name="expand_more" className="text-[20px] text-on-surface-variant transition-transform" />
                </summary>
                <div className="hidden px-6 pb-6 pt-2 bg-surface-container-lowest" id="faq-1">
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">No. In accordance with the Phase 1 Master Build Plan, all platform usage charges, matchmaking tolls, and booking commissions are set strictly to <strong>₦0 (Zero Naira)</strong> for smallholders, tractor syndicates, and input dealers. Farmers only pay the direct subsidized rate agreed upon with the machinery syndicate or agro-dealer, with zero platform margin deducted.</p>
                </div>
              </details>
              <details className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden group">
                <summary className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-headline-sm text-headline-sm text-on-surface font-semibold hover:bg-surface-container-low transition-colors list-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-3">
                    <Icon name="signal_cellular_off" className="text-secondary text-[22px]" />
                    <span>What if my farm does not have reliable 4G network coverage?</span>
                  </span>
                  <Icon name="expand_more" className="text-[20px] text-on-surface-variant transition-transform" />
                </summary>
                <div className="hidden px-6 pb-6 pt-2 bg-surface-container-lowest" id="faq-2">
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">CultivaNode is built with an offline-first architecture utilizing embedded local SQLite databases synchronized via PowerSync. State ADP field agents conduct farm registration and GPS boundary perimeter walks entirely offline. When the agent returns to network connectivity or ADP regional depots, all cadastral polygons automatically sync to the cloud mesh. Farmers also receive standard GSM/SMS task and payment updates that require no smartphone or mobile data.</p>
                </div>
              </details>
              <details className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden group">
                <summary className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-headline-sm text-headline-sm text-on-surface font-semibold hover:bg-surface-container-low transition-colors list-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-3">
                    <Icon name="account_balance" className="text-secondary text-[22px]" />
                    <span>How does CBN-partner escrow protect my money and machinery?</span>
                  </span>
                  <Icon name="expand_more" className="text-[20px] text-on-surface-variant transition-transform" />
                </summary>
                <div className="hidden px-6 pb-6 pt-2 bg-surface-container-lowest" id="faq-3">
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">Funds are never held on non-regulated ledgers. When a tillage or spraying task is booked, payment is reserved in an automated escrow clearing pool administered by Providus Bank PLC and Wema Bank ALAT rails under Central Bank of Nigeria settlement guidelines. The machinery operator is guaranteed payout upon digital geotagged proof-of-work, while the farmer is guaranteed a full refund if equipment does not mobilize within the agreed 48-hour operational window.</p>
                </div>
              </details>
              <details className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden group">
                <summary className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-headline-sm text-headline-sm text-on-surface font-semibold hover:bg-surface-container-low transition-colors list-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-3">
                    <Icon name="shield" className="text-secondary text-[22px]" />
                    <span>How is my biometric and farm boundary data protected under NDPA 2023?</span>
                  </span>
                  <Icon name="expand_more" className="text-[20px] text-on-surface-variant transition-transform" />
                </summary>
                <div className="hidden px-6 pb-6 pt-2 bg-surface-container-lowest" id="faq-4">
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">CultivaNode strictly complies with the Nigeria Data Protection Act (NDPA 2023). Geospatial polygon maps and personal identification information are encrypted in transit and at rest. Boundary information is exclusively utilized for agricultural dispatch coordination and cannot be commercialized or transferred to third-party lenders without explicit, documented consent from the registered landowner.</p>
                </div>
              </details>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
