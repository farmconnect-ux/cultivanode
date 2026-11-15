"use client";

// Ported from the "join_the_south_west_pilot_cultivanode_agrarian_mesh" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import { slot, type ScreenProps } from "./types";
import { showScreenToast } from "@/components/screens/screen-toast";
import { phrasebook } from "@/i18n/marketing";
import YO from "@/i18n/yo-marketing/pilot-page";

const tYo = phrasebook(YO);

export type PilotPageSlot = "form";

export function PilotPage({ lang = "en", slots }: ScreenProps<PilotPageSlot>) {
  const [selectedRole, setSelectedRole] = useState("Smallholder Farmer");
  const [selectedState, setSelectedState] = useState("Oyo");
  const [submitted, setSubmitted] = useState(false);

  const handleRoleSelect = (role: string, label: string) => {
    setSelectedRole(role);
    showScreenToast(tYo.now("Role Selected"), `Role set to: ${label}.`);
    const el = document.getElementById("enrollment-form");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    showScreenToast(tYo.now("Preview only"), tYo.now("This preview form does not send your details. Please use the sign-up page to join the pilot."));
  };
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <div className="w-full bg-surface-container-low py-3">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-wrap items-center justify-between gap-4">
            <nav className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant">
              <Link className="hover:text-primary transition-colors flex items-center gap-1.5" href={`/${lang}`}>
                <Icon name="hub" className="text-[16px]" />
                <span>{tYo("Pilot")}</span>
              </Link>
              <span className="text-outline-variant">/</span>
              <span className="text-on-surface-variant">{tYo("South-West Pilot")}</span>
              <span className="text-outline-variant">/</span>
              <span className="text-primary font-semibold">{tYo("Join the Pilot")}</span>
            </nav>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm"><span className="w-1.5 h-1.5 rounded-full bg-secondary mr-1.5 animate-pulse" />{tYo("Pilot Sign-ups Open")}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Oyo · Ogun · Osun · Ondo · Ekiti · Lagos")}</span>
            </div>
          </div>
        </div>
        <section className="w-full bg-surface-container-lowest py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded bg-surface-container text-primary font-label-sm text-label-sm">
                  <Icon name="travel_explore" className="text-[18px]" />
                  <span>{tYo("South-West Nigeria Pilot")}</span>
                </div>
                <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl lg:text-[2.75rem] lg:leading-[3.25rem] text-on-surface tracking-tight font-bold">{tYo("Join the South-West Pilot")}</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">{tYo("Join the pilot as a farmer, machinery owner, farm hand or input dealer in Oyo, Ogun, Ondo, Osun, Ekiti or Lagos. Hire verified machinery owners and farm hands near your farm, plan your crops and keep your farm books. No platform fee on hires during the pilot.")}</p>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <a className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg shadow-sm hover:bg-primary transition-all" href="#enrollment-form">
                    <Icon name="assignment_add" className="text-[20px]" />
                    <span>{tYo("Submit Pilot Application")}</span>
                  </a>
                  {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- downloads a file from an API route, not a page */}
                  <a className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg bg-surface-container-low text-on-surface font-label-lg text-label-lg hover:bg-surface-container transition-all" href="/api/documents/handbook?download=1">
                    <Icon name="download" className="text-[20px] text-primary" />
                    <span>{tYo("Participant Handbook (PDF)")}</span>
                  </a>
                </div>
              </div>
              <div className="lg:col-span-4 bg-surface-container-low rounded-xl p-6 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-2">
                    <Icon name="verified_user" className="text-primary text-[22px]" />
                    <span className="font-label-lg text-label-lg text-on-surface">{tYo("How Payments Work")}</span>
                  </div>
                  <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-highest text-primary font-semibold">{tYo("Pilot")}</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("When you hire in the pilot, you pay the tractor owner or farm hand directly. Escrow (money held until you confirm the job) is coming once a licensed payment partner is signed.")}</p>
                <div className="bg-surface-container-lowest rounded-lg p-3.5 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>{tYo("Farm location:")}</span>
                    <span className="font-semibold text-on-surface">{tYo("Pin on the map")}</span>
                  </div>
                  <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>{tYo("Offline mode:")}</span>
                    <span className="font-semibold text-secondary">{tYo("Coming soon")}</span>
                  </div>
                  <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>{tYo("ID checks:")}</span>
                    <span className="font-semibold text-on-surface">{tYo("NIN, BVN, bank account")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm pt-1">
                  <Icon name="security" className="text-[18px] text-secondary" />
                  <span>{tYo("We follow the Nigeria Data Protection Act 2023")}</span>
                </div>
              </div>
            </div>
            <div className="mt-12 bg-surface-container rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">{tYo("Who Can Join • South-West Pilot")}</span>
                </div>
                <span className="font-label-sm text-label-sm text-primary font-semibold">{tYo("Sign-ups open")}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-surface-container-lowest rounded-lg p-5 shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{tYo("Smallholders")}</span>
                    <span className="p-1 rounded bg-surface-container text-primary">
                      <Icon name="agriculture" className="text-[18px]" />
                    </span>
                  </div>
                  <div className="my-3">
                    <div className="flex items-baseline gap-2">
                      <span className="font-metric-num text-metric-num text-on-surface font-bold">{tYo("Open")}</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("for sign-up")}</span>
                    </div>
                  </div>
                  <div className="flex justify-between font-label-sm text-label-sm text-secondary font-semibold">
                    <span>{tYo("Farms of any size")}</span>
                    <span>{tYo("Join the pilot")}</span>
                  </div>
                </div>
                <div className="bg-surface-container-lowest rounded-lg p-5 shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{tYo("Machinery Owners")}</span>
                    <span className="p-1 rounded bg-surface-container text-primary">
                      <Icon name="precision_manufacturing" className="text-[18px]" />
                    </span>
                  </div>
                  <div className="my-3">
                    <div className="flex items-baseline gap-2">
                      <span className="font-metric-num text-metric-num text-on-surface font-bold">{tYo("Open")}</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("for sign-up")}</span>
                    </div>
                  </div>
                  <div className="flex justify-between font-label-sm text-label-sm text-secondary font-semibold">
                    <span>{tYo("NIN, BVN, bank checked")}</span>
                    <span>{tYo("List your equipment")}</span>
                  </div>
                </div>
                <div className="bg-surface-container-lowest rounded-lg p-5 shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{tYo("Farm Hands & Services")}</span>
                    <span className="p-1 rounded bg-surface-container text-primary">
                      <Icon name="engineering" className="text-[18px]" />
                    </span>
                  </div>
                  <div className="my-3">
                    <div className="flex items-baseline gap-2">
                      <span className="font-metric-num text-metric-num text-on-surface font-bold">{tYo("Open")}</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("for sign-up")}</span>
                    </div>
                  </div>
                  <div className="flex justify-between font-label-sm text-label-sm text-secondary font-semibold">
                    <span>{tYo("NIN, BVN, bank checked")}</span>
                    <span>{tYo("Get hired nearby")}</span>
                  </div>
                </div>
                <div className="bg-primary text-on-primary rounded-lg p-5 shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="font-label-sm text-label-sm text-on-primary/80 uppercase">{tYo("Platform Fee on Hires")}</span>
                    <span className="p-1 rounded bg-primary-container text-on-primary">
                      <Icon name="percent" className="text-[18px]" />
                    </span>
                  </div>
                  <div className="my-3">
                    <div className="flex items-baseline gap-1">
                      <span className="font-metric-num text-metric-num text-on-primary font-bold">₦0</span>
                      <span className="font-label-sm text-label-sm text-on-primary/70">{tYo("Platform Fee")}</span>
                    </div>
                    <p className="font-label-sm text-label-sm text-on-primary/80 mt-2">{tYo("No platform fee on hires during the pilot. You pay the provider directly.")}</p>
                  </div>
                  <div className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary-container font-semibold">
                    <Icon name="check_circle" className="text-[16px]" />
                    <span>{tYo("During the pilot")}</span>
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
                <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest font-bold">{tYo("Who It Is For")}</span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold mt-1">{tYo("Eligible Participant Categories")}</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-xl">{tYo("Pick the role that fits you to see what the pilot offers.")}</p>
              </div>
              <div className="text-right hidden md:block">
                <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Open in 6 South-West states")}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-5 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                    <Icon name="potted_plant" className="text-[26px]" />
                  </div>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider">{tYo("Cohort A • Production")}</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1 mb-2">{tYo("Smallholder & Commercial Farmer")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-4">{tYo("Cultivating 1 to 50+ Hectares of White Maize (SAMMAZ-15), Industrial Cassava (TME-419), Yam, Rice, or Horticultural Vegetables in SW states.")}</p>
                  <div className="bg-surface-container-low rounded-lg p-3 flex flex-col gap-2 mb-4">
                    <div className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface">
                      <Icon name="check" className="text-secondary text-[18px] shrink-0 mt-0.5" />
                      <span>{tYo("Crop calendar for 15 common South-West crops")}</span>
                    </div>
                    <div className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface">
                      <Icon name="check" className="text-secondary text-[18px] shrink-0 mt-0.5" />
                      <span>{tYo("Hire verified machinery owners and farm hands near your farm")}</span>
                    </div>
                    <div className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface">
                      <Icon name="check" className="text-secondary text-[18px] shrink-0 mt-0.5" />
                      <span>{tYo("10-day weather forecast, farm books and store records")}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleRoleSelect("Smallholder Farmer", "Smallholder Farmer")} className="w-full py-2.5 px-3 rounded-lg bg-surface-container text-primary hover:bg-primary hover:text-on-primary font-label-md text-label-md transition-colors text-center" type="button">{tYo("Select This Role →")}</button>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-5 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                    <Icon name="front_loader" className="text-[26px]" />
                  </div>
                  <span className="font-label-sm text-label-sm text-tertiary-container font-semibold uppercase tracking-wider">{tYo("Cohort B • Mechanization")}</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1 mb-2">{tYo("Tractor & Machinery Syndicate")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-4">{tYo("Fleet owners and leasing syndicates controlling 4WD tractors (65HP-120HP), self-propelled boom sprayers, or multi-crop combine harvesters.")}</p>
                  <div className="bg-surface-container-low rounded-lg p-3 flex flex-col gap-2 mb-4">
                    <div className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface">
                      <Icon name="check" className="text-secondary text-[18px] shrink-0 mt-0.5" />
                      <span>{tYo("Get found by farmers near your equipment")}</span>
                    </div>
                    <div className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface">
                      <Icon name="check" className="text-secondary text-[18px] shrink-0 mt-0.5" />
                      <span>{tYo("Farmers pay you directly in the pilot (escrow coming)")}</span>
                    </div>
                    <div className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface">
                      <Icon name="check" className="text-secondary text-[18px] shrink-0 mt-0.5" />
                      <span>{tYo("No platform fee on hires during the pilot")}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleRoleSelect("Tractor Syndicate Owner", "Tractor & Machinery Syndicate")} className="w-full py-2.5 px-3 rounded-lg bg-surface-container text-primary hover:bg-primary hover:text-on-primary font-label-md text-label-md transition-colors text-center" type="button">{tYo("Select This Role →")}</button>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-5 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                    <Icon name="badge" className="text-[26px]" />
                  </div>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider">{tYo("Cohort C • Field Services")}</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1 mb-2">{tYo("Skilled Agro-Operator & Sprayer")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-4">{tYo("Spray teams, tractor drivers, pruning gangs, soil sampling scouts and harvest workers in rural areas.")}</p>
                  <div className="bg-surface-container-low rounded-lg p-3 flex flex-col gap-2 mb-4">
                    <div className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface">
                      <Icon name="check" className="text-secondary text-[18px] shrink-0 mt-0.5" />
                      <span>{tYo("Checked with your NIN, BVN and bank account so farmers can trust you")}</span>
                    </div>
                    <div className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface">
                      <Icon name="check" className="text-secondary text-[18px] shrink-0 mt-0.5" />
                      <span>{tYo("Get hired by farmers near you")}</span>
                    </div>
                    <div className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface">
                      <Icon name="check" className="text-secondary text-[18px] shrink-0 mt-0.5" />
                      <span>{tYo("Paid directly by the farmer in the pilot")}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleRoleSelect("Agro-Operator / Sprayer", "Skilled Agro-Operator & Sprayer")} className="w-full py-2.5 px-3 rounded-lg bg-surface-container text-primary hover:bg-primary hover:text-on-primary font-label-md text-label-md transition-colors text-center" type="button">{tYo("Select This Role →")}</button>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-5 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                    <Icon name="storefront" className="text-[26px]" />
                  </div>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider">{tYo("Cohort D • Input Channel")}</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1 mb-2">{tYo("Input Merchant & Agro-Dealer")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-4">{tYo("Sellers of seed, NPK/Urea fertilisers, crop protection products and storage bags.")}</p>
                  <div className="bg-surface-container-low rounded-lg p-3 flex flex-col gap-2 mb-4">
                    <div className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface">
                      <Icon name="check" className="text-secondary text-[18px] shrink-0 mt-0.5" />
                      <span>{tYo("Reach farmers who plan with the crop calendar")}</span>
                    </div>
                    <div className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface">
                      <Icon name="check" className="text-secondary text-[18px] shrink-0 mt-0.5" />
                      <span>{tYo("Sell on the CultivaNode marketplace")}</span>
                    </div>
                    <div className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface">
                      <Icon name="check" className="text-secondary text-[18px] shrink-0 mt-0.5" />
                      <span>{tYo("Buyers pay at checkout through a licensed payment provider")}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleRoleSelect("Input Merchant / Agro-Dealer", "Input Merchant & Agro-Dealer")} className="w-full py-2.5 px-3 rounded-lg bg-surface-container text-primary hover:bg-primary hover:text-on-primary font-label-md text-label-md transition-colors text-center" type="button">{tYo("Select This Role →")}</button>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-16 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">{tYo("Pilot Area")}</span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold mt-1">{tYo("Farming Areas in the Pilot")}</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-2xl">{tYo("Example farming areas in the South-West pilot. These are not offices or depots: you can join from anywhere in the six pilot states.")}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded bg-surface-container-highest text-on-surface font-label-sm text-label-sm"><Icon name="satellite_alt" className="text-[16px] mr-1 text-primary" />{tYo(" Example areas")}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-secondary" />
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">{tYo("Area 01: Oke-Ogun Grain Corridor")}</span>
                    </div>
                    <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold">{tYo("Open for sign-up")}</span>
                  </div>
                  <div className="w-full h-48 bg-cover bg-center rounded-lg relative overflow-hidden mb-5 shadow-sm" data-location="Saki West, Oyo State, Nigeria" style={{ backgroundImage: "url('/images/screens/ecc4c6e4275d.webp')" }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex items-end p-4">
                      <div className="text-on-primary">
                        <div className="font-label-sm text-label-sm uppercase tracking-wider opacity-90">{tYo("Agro-Ecological Zone")}</div>
                        <div className="font-headline-sm text-headline-sm font-bold">{tYo("Derived Guinea Savanna")}</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-surface-container-low rounded-lg p-3">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{tYo("Example LGAs")}</span>
                      <p className="font-label-md text-label-md text-on-surface mt-1 font-semibold">{tYo("Saki West, Iseyin, Kisi (Oyo State)")}</p>
                    </div>
                    <div className="bg-surface-container-low rounded-lg p-3">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{tYo("Agronomic Priority")}</span>
                      <p className="font-label-md text-label-md text-on-surface mt-1 font-semibold">{tYo("SAMMAZ-15 White Maize, Industrial Cassava")}</p>
                    </div>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-4">{tYo("Wide, open savanna plots suited to tractor tillage.")}</p>
                </div>
                <div className="pt-4 flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                  <span className="flex items-center gap-1.5"><Icon name="local_shipping" className="text-[16px] text-primary" />{tYo(" Tractor hire")}</span>
                  <span className="font-semibold text-primary">{tYo("Join the pilot")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-secondary" />
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">{tYo("Area 02: Ogun Agro-Forestry & Cassava Belt")}</span>
                    </div>
                    <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold">{tYo("Open for sign-up")}</span>
                  </div>
                  <div className="w-full h-48 bg-cover bg-center rounded-lg relative overflow-hidden mb-5 shadow-sm" data-location="Abeokuta North, Ogun State, Nigeria" style={{ backgroundImage: "url('/images/screens/08dd797cb381.webp')" }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex items-end p-4">
                      <div className="text-on-primary">
                        <div className="font-label-sm text-label-sm uppercase tracking-wider opacity-90">{tYo("Agro-Ecological Zone")}</div>
                        <div className="font-headline-sm text-headline-sm font-bold">{tYo("Rainforest Lowlands")}</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-surface-container-low rounded-lg p-3">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{tYo("Example LGAs")}</span>
                      <p className="font-label-md text-label-md text-on-surface mt-1 font-semibold">{tYo("Abeokuta North, Sagamu, Ijebu-Ode")}</p>
                    </div>
                    <div className="bg-surface-container-low rounded-lg p-3">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{tYo("Agronomic Priority")}</span>
                      <p className="font-label-md text-label-md text-on-surface mt-1 font-semibold">{tYo("TME-419 Cassava, Fresh Veg, Mechanization")}</p>
                    </div>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-4">{tYo("Close to starch processors and Lagos markets.")}</p>
                </div>
                <div className="pt-4 flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                  <span className="flex items-center gap-1.5"><Icon name="local_shipping" className="text-[16px] text-primary" />{tYo(" Tractor hire")}</span>
                  <span className="font-semibold text-primary">{tYo("Join the pilot")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-secondary" />
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">{tYo("Area 03: Osun River Valley")}</span>
                    </div>
                    <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface font-semibold">{tYo("Open for sign-up")}</span>
                  </div>
                  <div className="w-full h-48 bg-cover bg-center rounded-lg relative overflow-hidden mb-5 shadow-sm" data-location="Osogbo, Osun State, Nigeria" style={{ backgroundImage: "url('/images/screens/bca1c5f6d8a8.webp')" }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex items-end p-4">
                      <div className="text-on-primary">
                        <div className="font-label-sm text-label-sm uppercase tracking-wider opacity-90">{tYo("Agro-Ecological Zone")}</div>
                        <div className="font-headline-sm text-headline-sm font-bold">{tYo("Transitional River Basin")}</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-surface-container-low rounded-lg p-3">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{tYo("Example LGAs")}</span>
                      <p className="font-label-md text-label-md text-on-surface mt-1 font-semibold">{tYo("Osogbo, Ejigbo, Ede North/South")}</p>
                    </div>
                    <div className="bg-surface-container-low rounded-lg p-3">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{tYo("Agronomic Priority")}</span>
                      <p className="font-label-md text-label-md text-on-surface mt-1 font-semibold">{tYo("Mixed Horticultural, Grain & Organic Veg")}</p>
                    </div>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-4">{tYo("High-value vegetables and irrigated grains along the Osun River basin.")}</p>
                </div>
                <div className="pt-4 flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                  <span className="flex items-center gap-1.5"><Icon name="local_shipping" className="text-[16px] text-primary" />{tYo(" Tractor hire")}</span>
                  <span className="font-semibold text-primary">{tYo("Join the pilot")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-secondary" />
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">{tYo("Area 04: Ondo Central & Cash Crops")}</span>
                    </div>
                    <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold">{tYo("Open for sign-up")}</span>
                  </div>
                  <div className="w-full h-48 bg-cover bg-center rounded-lg relative overflow-hidden mb-5 shadow-sm" data-location="Akure, Ondo State, Nigeria" style={{ backgroundImage: "url('/images/screens/c8709d2eeb73.webp')" }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex items-end p-4">
                      <div className="text-on-primary">
                        <div className="font-label-sm text-label-sm uppercase tracking-wider opacity-90">{tYo("Agro-Ecological Zone")}</div>
                        <div className="font-headline-sm text-headline-sm font-bold">{tYo("High Precipitation Rainforest")}</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-surface-container-low rounded-lg p-3">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{tYo("Example LGAs")}</span>
                      <p className="font-label-md text-label-md text-on-surface mt-1 font-semibold">{tYo("Akure South/North, Owo, Ondo City")}</p>
                    </div>
                    <div className="bg-surface-container-low rounded-lg p-3">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{tYo("Agronomic Priority")}</span>
                      <p className="font-label-md text-label-md text-on-surface mt-1 font-semibold">{tYo("Cocoa Agroforestry, Oil Palm, Understory Cassava")}</p>
                    </div>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-4">{tYo("Cocoa, oil palm and cassava under tree crops. Farm hands for spraying and harvest can be hired in the pilot.")}</p>
                </div>
                <div className="pt-4 flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                  <span className="flex items-center gap-1.5"><Icon name="local_shipping" className="text-[16px] text-primary" />{tYo(" Farm hand hire")}</span>
                  <span className="font-semibold text-primary">{tYo("Join the pilot")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-16 bg-surface">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest font-bold">{tYo("Next Steps")}</span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold mt-1">{tYo("What Happens After You Apply")}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">{tYo("What happens after you join the pilot.")}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg font-black text-on-surface select-none">01</div>
                <div>
                  <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-label-lg mb-4">1</div>
                  <span className="inline-block px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-primary font-semibold mb-2">{tYo("Step 1")}</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-2">{tYo("Sign Up")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Create your account with your email address. Phone sign-in is coming soon. If you list equipment or receive payments, we check your NIN, BVN and bank account, with your consent.")}</p>
                </div>
                <div className="pt-4 flex items-center gap-1.5 font-label-sm text-label-sm text-secondary">
                  <Icon name="verified" className="text-[16px]" />
                  <span>{tYo("No paperwork")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg font-black text-on-surface select-none">02</div>
                <div>
                  <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-label-lg mb-4">2</div>
                  <span className="inline-block px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-primary font-semibold mb-2">{tYo("Step 2")}</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-2">{tYo("Add Your Farm")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Drop a pin for your farm on the map in the app. Boundary walking comes later.")}</p>
                </div>
                <div className="pt-4 flex items-center gap-1.5 font-label-sm text-label-sm text-secondary">
                  <Icon name="satellite" className="text-[16px]" />
                  <span>{tYo("Farm pin saved")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg font-black text-on-surface select-none">03</div>
                <div>
                  <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-label-lg mb-4">3</div>
                  <span className="inline-block px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-primary font-semibold mb-2">{tYo("Step 3")}</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-2">{tYo("Find Help Near You")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Search for verified machinery owners and farm hands near your farm, and plan your season with the crop calendar.")}</p>
                </div>
                <div className="pt-4 flex items-center gap-1.5 font-label-sm text-label-sm text-secondary">
                  <Icon name="near_me" className="text-[16px]" />
                  <span>{tYo("Near your farm")}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg font-black text-on-surface select-none">04</div>
                <div>
                  <div className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-label-lg mb-4">4</div>
                  <span className="inline-block px-2 py-0.5 rounded bg-secondary-container font-label-sm text-label-sm text-on-secondary-container font-semibold mb-2">{tYo("Step 4")}</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-2">{tYo("Hire and Pay Directly")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Book the job and pay the provider directly. Escrow (money held until you confirm the job) is coming once a licensed payment partner is signed.")}</p>
                </div>
                <div className="pt-4 flex items-center gap-1.5 font-label-sm text-label-sm text-secondary">
                  <Icon name="lock" className="text-[16px]" />
                  <span>{tYo("Consent before ID checks")}</span>
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
                    <span>{tYo("Pilot Sign-up")}</span>
                  </div>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold mt-1">{tYo("Send Pilot Application")}</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{tYo("Tell us about your farm or business and we will be in touch about the pilot.")}</p>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm flex items-center gap-2 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <span>{tYo("Server Time: GMT+1 (WAT)")}</span>
                </div>
              </div>
              {slot(slots, "form", (
                <div className="space-y-8" id="pilotForm" role="form">
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-surface-container text-primary flex items-center justify-center font-label-sm text-label-sm font-bold">1</span>
                      <span>{tYo("Your Details")}</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block font-label-md text-label-md text-on-surface font-semibold mb-2" htmlFor="fullName">{tYo("Full Name (as per NIN) ")}<span className="text-error">*</span></label>
                        <input className="w-full h-10 px-3.5 bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" id="fullName" placeholder={tYo("e.g. Babatunde Olawale Adeleke")} required type="text" />
                      </div>
                      <div>
                        <label className="block font-label-md text-label-md text-on-surface font-semibold mb-2" htmlFor="phoneNumber">{tYo("WhatsApp / Phone (+234) ")}<span className="text-error">*</span></label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant font-label-md text-label-md">+234</div>
                          <input className="w-full h-10 pl-14 pr-3 bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" id="phoneNumber" placeholder="803 123 4567" required type="tel" />
                        </div>
                      </div>
                      <div>
                        <label className="block font-label-md text-label-md text-on-surface font-semibold mb-2" htmlFor="emailAddress">{tYo("Email Address ")}<span className="text-on-surface-variant font-normal">{tYo("(Optional)")}</span></label>
                        <input className="w-full h-10 px-3.5 bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" id="emailAddress" placeholder={tYo("name@example.com")} type="email" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-surface-container text-primary flex items-center justify-center font-label-sm text-label-sm font-bold">2</span>
                      <span>{tYo("Your Role & Crops")}</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block font-label-md text-label-md text-on-surface font-semibold mb-2" htmlFor="participantRole">{tYo("Participant Role ")}<span className="text-error">*</span></label>
                        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="w-full h-10 px-3 bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" id="participantRole" required>
                          <option disabled value="">{tYo("Select category...")}</option>
                          <option value="Smallholder Farmer">{tYo("Smallholder Farmer (1-10 Ha)")}</option>
                          <option value="Commercial Farmer">{tYo("Commercial Agro-Enterprise (10-50+ Ha)")}</option>
                          <option value="Tractor Syndicate Owner">{tYo("Tractor & Machinery Syndicate Owner")}</option>
                          <option value="Agro-Operator / Sprayer">{tYo("Agro-Operator / Sprayer Gang")}</option>
                          <option value="Input Merchant / Agro-Dealer">{tYo("Input Merchant / Agro-Dealer")}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-label-md text-label-md text-on-surface font-semibold mb-2" htmlFor="targetState">{tYo("Target State ")}<span className="text-error">*</span></label>
                        <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="w-full h-10 px-3 bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" id="targetState" required>
                          <option disabled value="">{tYo("Select South-West State...")}</option>
                          <option value="Oyo">{tYo("Oyo State")}</option>
                          <option value="Ogun">{tYo("Ogun State")}</option>
                          <option value="Ondo">{tYo("Ondo State")}</option>
                          <option value="Osun">{tYo("Osun State")}</option>
                          <option value="Ekiti">{tYo("Ekiti State")}</option>
                          <option value="Lagos">{tYo("Lagos State")}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-label-md text-label-md text-on-surface font-semibold mb-2" htmlFor="targetLga">{tYo("Local Govt Area (LGA) ")}<span className="text-error">*</span></label>
                        <select defaultValue="" className="w-full h-10 px-3 bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" id="targetLga" required>
                          <option disabled value="">{tYo("Select State first...")}</option>
                          <option value="Ibadan North">{tYo("Ibadan North")}</option>
                          <option value="Ibarapa Central">{tYo("Ibarapa Central")}</option>
                          <option value="Oyo West">{tYo("Oyo West")}</option>
                          <option value="Saki West">{tYo("Saki West")}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-surface-container text-primary flex items-center justify-center font-label-sm text-label-sm font-bold">3</span>
                      <span>{tYo("Farm Capacity / Machinery Inventory")}</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block font-label-md text-label-md text-on-surface font-semibold mb-2" htmlFor="landSize">{tYo("Farm Size (Hectares) or Equipment Count ")}<span className="text-error">*</span></label>
                        <input className="w-full h-10 px-3.5 bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" id="landSize" min="0.5" placeholder={tYo("e.g. 12.5 (Ha) or 2 (Tractors)")} required step="0.5" type="number" />
                      </div>
                      <div>
                        <label className="block font-label-md text-label-md text-on-surface font-semibold mb-2" htmlFor="primaryCrops">{tYo("Primary Crops Cultivated / Machinery Specs ")}<span className="text-error">*</span></label>
                        <input className="w-full h-10 px-3.5 bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" id="primaryCrops" placeholder={tYo("e.g. Cassava (TME-419), White Maize, or Massey Ferguson 75HP")} required type="text" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-surface-container-low rounded-xl p-5 space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary" required type="checkbox" />
                      <span className="font-body-sm text-body-sm text-on-surface"><strong>{tYo("Nigeria Data Protection Act (NDPA 2023) Consent:")}</strong>{tYo(" I agree that CultivaNode may store the details on this form to contact me about the pilot.")}</span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary" required type="checkbox" />
                      <span className="font-body-sm text-body-sm text-on-surface"><strong>{tYo("Pilot Terms:")}</strong>{tYo(" I understand that in the pilot I pay providers directly, there is no platform fee on hires, and escrow is not live yet.")}</span>
                    </label>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                    <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
                      <Icon name="lock" className="text-secondary text-[18px]" />
                      <span>{tYo("Sent over a secure (HTTPS) connection")}</span>
                    </div>
                    <button onClick={handleSubmit} className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-primary-container text-on-primary hover:bg-primary font-label-lg text-label-lg shadow-sm transition-all flex items-center justify-center gap-2" id="submitButton" type="submit">
                      <Icon name="send" className="text-[20px]" />
                      <span>{tYo("Send Pilot Application")}</span>
                    </button>
                  </div>
                  <div className={`${submitted ? "block" : "hidden"} rounded-xl p-5 bg-secondary-container text-on-secondary-container`} id="submissionAlert">
                    <div className="flex items-start gap-3">
                      <Icon name="task_alt" className="text-[24px] text-secondary" />
                      <div>
                        <h4 className="font-headline-sm text-headline-sm font-bold">{tYo("Preview only")}</h4>
                        <p className="font-body-sm text-body-sm mt-1">{tYo("This preview form does not send your details. Please use the sign-up page to join the pilot.")}</p>
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
              <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest font-bold">{tYo("Frequently Addressed Inquiries")}</span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold mt-1">{tYo("Pilot FAQ")}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">{tYo("Answers about fees, weak network, payments and your data.")}</p>
            </div>
            <div className="space-y-4">
              <details className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden group">
                <summary className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-headline-sm text-headline-sm text-on-surface font-semibold hover:bg-surface-container-low transition-colors list-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-3">
                    <Icon name="payments" className="text-secondary text-[22px]" />
                    <span>{tYo("Are there any hidden fees or commissions during the pilot?")}</span>
                  </span>
                  <Icon name="expand_more" className="text-[20px] text-on-surface-variant transition-transform" />
                </summary>
                <div className="hidden px-6 pb-6 pt-2 bg-surface-container-lowest" id="faq-1">
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{tYo("No. There is ")}<strong>{tYo("no platform fee on hires")}</strong>{tYo(" during the pilot. You pay the tractor owner or farm hand directly, at the price you agree with them.")}</p>
                </div>
              </details>
              <details className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden group">
                <summary className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-headline-sm text-headline-sm text-on-surface font-semibold hover:bg-surface-container-low transition-colors list-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-3">
                    <Icon name="signal_cellular_off" className="text-secondary text-[22px]" />
                    <span>{tYo("What if my farm does not have reliable 4G network coverage?")}</span>
                  </span>
                  <Icon name="expand_more" className="text-[20px] text-on-surface-variant transition-transform" />
                </summary>
                <div className="hidden px-6 pb-6 pt-2 bg-surface-container-lowest" id="faq-2">
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{tYo("Today CultivaNode needs a network connection to save your records. Offline mode is coming soon, so you can record work on your farm without network and sync it later. SMS updates for farmers without smartphones are planned.")}</p>
                </div>
              </details>
              <details className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden group">
                <summary className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-headline-sm text-headline-sm text-on-surface font-semibold hover:bg-surface-container-low transition-colors list-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-3">
                    <Icon name="account_balance" className="text-secondary text-[22px]" />
                    <span>{tYo("Is my money held in escrow?")}</span>
                  </span>
                  <Icon name="expand_more" className="text-[20px] text-on-surface-variant transition-transform" />
                </summary>
                <div className="hidden px-6 pb-6 pt-2 bg-surface-container-lowest" id="faq-3">
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{tYo("Not yet. When you hire in the pilot, you pay the tractor owner or farm hand directly. Escrow (money held until you confirm the job) is coming once a licensed payment partner is signed.")}</p>
                </div>
              </details>
              <details className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden group">
                <summary className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-headline-sm text-headline-sm text-on-surface font-semibold hover:bg-surface-container-low transition-colors list-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-3">
                    <Icon name="shield" className="text-secondary text-[22px]" />
                    <span>{tYo("How is my ID and farm data protected?")}</span>
                  </span>
                  <Icon name="expand_more" className="text-[20px] text-on-surface-variant transition-transform" />
                </summary>
                <div className="hidden px-6 pb-6 pt-2 bg-surface-container-lowest" id="faq-4">
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{tYo("We follow the Nigeria Data Protection Act 2023: we ask for consent before ID checks, store only masked ID numbers, and you can ask to download or delete your data. Records are kept in a Postgres database (Supabase) with row-level security. We do not sell your farm data.")}</p>
                </div>
              </details>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
