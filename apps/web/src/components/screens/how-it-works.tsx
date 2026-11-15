"use client";

// Ported from the "how_it_works_trust_framework_cultivanode" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";
import { showScreenToast } from "@/components/screens/screen-toast";
import { phrasebook } from "@/i18n/marketing";
import YO from "@/i18n/yo-marketing/how-it-works";

const tYo = phrasebook(YO);

export function HowItWorks({ lang }: ScreenProps) {
  const [activeTab, setActiveTab] = useState<"farmer" | "fleet" | "buyer" | "agent">("farmer");
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <section className="relative px-margin-desktop py-space-xl max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-space-md max-w-4xl">
            <div className="flex items-center gap-space-xs font-label-sm text-label-sm uppercase tracking-wider text-secondary">
              <span className="inline-block w-2 h-2 rounded-full bg-secondary" />
              <span>{tYo("Transparency & Operational Protocol · /en/how-it-works")}</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight md:text-[2.75rem] md:leading-[3.25rem]">{tYo("How CultivaNode Powers Verifiable Agricultural Collaboration")}</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl leading-relaxed">{tYo("Step-by-step journeys for farmers, tractor owners, produce buyers and field agents. We are in a pilot in South-West Nigeria; anything not live yet is marked as coming.")}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm pt-space-md">
              <div className="flex items-center gap-space-xs p-space-sm rounded-lg bg-surface-container-low shadow-sm">
                <Icon name="verified_user" filled className="text-[20px] text-secondary" />
                <span className="font-label-sm text-label-sm text-on-surface font-semibold">{tYo("Verified Providers")}</span>
              </div>
              <div className="flex items-center gap-space-xs p-space-sm rounded-lg bg-surface-container-low shadow-sm">
                <Icon name="pin_drop" filled className="text-[20px] text-secondary" />
                <span className="font-label-sm text-label-sm text-on-surface font-semibold">{tYo("Farm Location Pin")}</span>
              </div>
              <div className="flex items-center gap-space-xs p-space-sm rounded-lg bg-surface-container-low shadow-sm">
                <Icon name="timer" filled className="text-[20px] text-secondary" />
                <span className="font-label-sm text-label-sm text-on-surface font-semibold">{tYo("No Fee on Pilot Hires")}</span>
              </div>
              <div className="flex items-center gap-space-xs p-space-sm rounded-lg bg-surface-container-low shadow-sm">
                <Icon name="gavel" filled className="text-[20px] text-secondary" />
                <span className="font-label-sm text-label-sm text-on-surface font-semibold">{tYo("Planned Features Marked")}</span>
              </div>
            </div>
          </div>
          <div className="mt-space-xl p-space-lg rounded-xl bg-surface-container-lowest shadow-md grid grid-cols-1 md:grid-cols-3 gap-space-lg">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">{tYo("Pilot Area")}</span>
                <span className="font-label-xs text-label-sm text-secondary bg-surface-container px-space-xs py-0.5 rounded-full font-semibold">{tYo("South-West")}</span>
              </div>
              <span className="font-metric-num text-metric-num text-primary">{tYo("6 States")}</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Oyo, Ogun, Osun, Ondo, Ekiti and Lagos.")}</p>
            </div>
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">{tYo("Hire Payments")}</span>
                <span className="font-label-xs text-label-sm text-secondary bg-surface-container px-space-xs py-0.5 rounded-full font-semibold">{tYo("Pilot")}</span>
              </div>
              <span className="font-metric-num text-metric-num text-primary">{tYo("Direct")}</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("You pay the provider directly. Escrow comes once a licensed payment partner is signed.")}</p>
            </div>
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">{tYo("Weather Forecast")}</span>
                <span className="font-label-xs text-label-sm text-secondary bg-surface-container px-space-xs py-0.5 rounded-full font-semibold">{tYo("Per Farm")}</span>
              </div>
              <span className="font-metric-num text-metric-num text-primary">{tYo("10 Days")}</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("A forecast for your farm location to help plan field work.")}</p>
            </div>
          </div>
        </section>
        <section className="px-margin-desktop py-space-xl max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
            <div className="max-w-2xl">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">{tYo("§4.11 Operational Sequences")}</span>
              <h2 className="font-headline-lg text-headline-lg text-primary mt-space-xs">{tYo("Participant Lifecycle & Execution Workflows")}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs">{tYo("See how each role uses CultivaNode, step by step. Steps that are not live yet are marked.")}</p>
            </div>
            <div className="inline-flex p-1 bg-surface-container rounded-lg self-start md:self-auto shadow-sm" role="tablist">
              <button
                aria-selected={activeTab === "farmer"}
                className={`px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all ${
                  activeTab === "farmer"
                    ? "bg-primary-container text-on-primary font-bold shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                id="tab-farmer"
                role="tab"
                type="button"
                onClick={() => {
                  setActiveTab("farmer");
                  showScreenToast(tYo.now("Viewing Smallholder Farmer & Farm Owner lifecycle."));
                }}
              >{tYo("The Farmer")}</button>
              <button
                aria-selected={activeTab === "fleet"}
                className={`px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all ${
                  activeTab === "fleet"
                    ? "bg-primary-container text-on-primary font-bold shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                id="tab-fleet"
                role="tab"
                type="button"
                onClick={() => {
                  setActiveTab("fleet");
                  showScreenToast(tYo.now("Viewing Machinery Fleet Syndicates lifecycle."));
                }}
              >{tYo("Tractor Fleet Owner")}</button>
              <button
                aria-selected={activeTab === "buyer"}
                className={`px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all ${
                  activeTab === "buyer"
                    ? "bg-primary-container text-on-primary font-bold shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                id="tab-buyer"
                role="tab"
                type="button"
                onClick={() => {
                  setActiveTab("buyer");
                  showScreenToast(tYo.now("Viewing Produce Offtakers & Millers lifecycle."));
                }}
              >{tYo("Produce Offtaker")}</button>
              <button
                aria-selected={activeTab === "agent"}
                className={`px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all ${
                  activeTab === "agent"
                    ? "bg-primary-container text-on-primary font-bold shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                id="tab-agent"
                role="tab"
                type="button"
                onClick={() => {
                  setActiveTab("agent");
                  showScreenToast(tYo.now("Viewing Field Agents (planned) lifecycle."));
                }}
              >{tYo("Field Agent (Planned)")}</button>
            </div>
          </div>
          <div className={`${activeTab === "farmer" ? "flex" : "hidden"} flex-col gap-space-lg`} id="journey-farmer">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
              <div className="lg:col-span-4 rounded-xl bg-surface-container-lowest p-space-lg shadow-md flex flex-col justify-between">
                <div className="flex flex-col gap-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="agriculture" filled className="text-[28px]" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">{tYo("The Smallholder & Farm Owner")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Designed for growers managing 1 to 50 hectares in places like Iseyin, Saki, Sagamu and Ondo. Hire machinery and farm hands, follow a crop calendar and keep farm books.")}</p>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low mt-space-lg flex flex-col gap-space-xs">
                  <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold">{tYo("Your Farm Record")}</span>
                  <span className="font-headline-sm text-headline-sm text-primary">{tYo("Farm Location Pin")}</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Stored with PostGIS. Boundary walking comes later.")}</p>
                </div>
              </div>
              <div className="lg:col-span-8 flex flex-col gap-space-sm">
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">1</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">{tYo("Sign Up & Verify")}</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">{tYo("NIN, BVN & Bank")}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{tYo("Sign up with your phone. Everyone who lists equipment or receives payments is checked with their NIN, BVN and bank account through a licensed verification provider, and we ask for consent first.")}</p>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">2</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">{tYo("Add Your Farm")}</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">{tYo("Map Pin")}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{tYo("Drop a pin for your farm on the map. Walking the boundary with your phone comes later.")}</p>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">3</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">{tYo("Plan Agronomic Production")}</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">{tYo("15 SW Crops")}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{tYo("Pick your crop and get a season calendar for 15 common South-West crops, with a 10-day weather forecast for your farm.")}</p>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">4</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">{tYo("Book Tractors & Farm Hands")}</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">{tYo("Pay Directly")}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{tYo("Request ploughing, harrowing or ridging from verified owners near your farm. In the pilot you pay the tractor owner or farm hand directly. Escrow (money held until you confirm the job) is coming once a licensed payment partner is signed.")}</p>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">5</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">{tYo("Harvest & Sell")}</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">{tYo("Marketplace")}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{tYo("List your produce on the marketplace. Buyers pay at checkout by card, bank transfer or USSD through a licensed payment provider.")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={`${activeTab === "fleet" ? "flex" : "hidden"} flex-col gap-space-lg`} id="journey-fleet">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
              <div className="lg:col-span-4 rounded-xl bg-surface-container-lowest p-space-lg shadow-md flex flex-col justify-between">
                <div className="flex flex-col gap-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="precision_manufacturing" filled className="text-[28px]" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">{tYo("Tractor & Machinery Owners")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("For commercial tractor owners, implement rental cooperatives and independent mechanics serving farms across South-West Nigeria.")}</p>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low mt-space-lg flex flex-col gap-space-xs">
                  <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold">{tYo("Payment in the Pilot")}</span>
                  <span className="font-headline-sm text-headline-sm text-primary">{tYo("The Farmer Pays You Directly")}</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Escrow (money held until the farmer confirms the job) is coming once a licensed payment partner is signed.")}</p>
                </div>
              </div>
              <div className="lg:col-span-8 flex flex-col gap-space-sm">
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">1</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">{tYo("Register Equipment & Service Radius")}</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">{tYo("NIN, BVN & Bank")}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{tYo("List your tractor and implements (disc ploughs, harrows, sprayers) and how far you can travel. Owners are checked with their NIN, BVN and bank account.")}</p>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">2</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">{tYo("Get Hire Requests")}</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">{tYo("Nearby Farms")}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{tYo("Farmers near you send hire requests. Grouping nearby jobs into one trip is planned.")}</p>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">3</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">{tYo("Check In at the Farm")}</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">{tYo("Coming Soon")}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{tYo("Coming soon: tap check-in when you arrive, so the farmer knows you are there.")}</p>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">4</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">{tYo("Proof of Work (PoW)")}</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">{tYo("Coming Soon")}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{tYo("Coming soon: take photos of the finished work; each photo carries its location and time.")}</p>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">5</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">{tYo("Get Paid (No Platform Fee)")}</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">{tYo("Pilot")}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{tYo("In the pilot the farmer pays you directly, and there is no platform fee on hires. Ratings on completed jobs are coming soon.")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={`${activeTab === "buyer" ? "flex" : "hidden"} flex-col gap-space-lg`} id="journey-buyer">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
              <div className="lg:col-span-4 rounded-xl bg-surface-container-lowest p-space-lg shadow-md flex flex-col justify-between">
                <div className="flex flex-col gap-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="warehouse" filled className="text-[28px]" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">{tYo("Produce Offtakers & Industrial Millers")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("For feed mills, breweries, starch factories and food makers buying grain, cassava and cocoa from farmers.")}</p>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low mt-space-lg flex flex-col gap-space-xs">
                  <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold">{tYo("Quality Safeguard")}</span>
                  <span className="font-headline-sm text-headline-sm text-primary">{tYo("Quality Certificates (Planned)")}</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Moisture and aflatoxin certificates linked to each lot are planned.")}</p>
                </div>
              </div>
              <div className="lg:col-span-8 flex flex-col gap-space-sm">
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">1</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">{tYo("Browse Produce")}</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">{tYo("Marketplace")}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{tYo("Browse produce listed by farmers on the marketplace.")}</p>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">2</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">{tYo("Pay at Checkout")}</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">{tYo("Licensed Provider")}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{tYo("Pay by card, bank transfer or USSD through a licensed payment provider.")}</p>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">3</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">{tYo("Haulage & Waybills")}</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">{tYo("Planned")}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{tYo("Planned: track haulage and use QR-coded waybills from the farm gate.")}</p>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">4</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">{tYo("Weighbridge Records")}</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">{tYo("Planned")}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{tYo("Planned: record the weighbridge slip and moisture reading when the truck arrives.")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={`${activeTab === "agent" ? "flex" : "hidden"} flex-col gap-space-lg`} id="journey-agent">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
              <div className="lg:col-span-4 rounded-xl bg-surface-container-lowest p-space-lg shadow-md flex flex-col justify-between">
                <div className="flex flex-col gap-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="badge" filled className="text-[28px]" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">{tYo("Field Agents (Planned)")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("We plan to work with field agents who help farmers sign up and use the app. We will list partners here once agreements are signed.")}</p>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low mt-space-lg flex flex-col gap-space-xs">
                  <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold">{tYo("Agent Pay")}</span>
                  <span className="font-headline-sm text-headline-sm text-primary">{tYo("Not Set Up Yet")}</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("How field agents are paid will be set when the programme starts.")}</p>
                </div>
              </div>
              <div className="lg:col-span-8 flex flex-col gap-space-sm">
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">1</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">{tYo("Agent App & Offline Mode")}</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">{tYo("Coming Soon")}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{tYo("Offline mode is coming soon, so registrations can continue where signal is weak.")}</p>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">2</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">{tYo("Assisted Onboarding in Local Dialects")}</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">{tYo("Yorùbá & Pidgin")}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{tYo("Help farmers sign up in Yorùbá, Pidgin or English, and explain consent before any ID check.")}</p>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">3</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">{tYo("Boundary Walking")}</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">{tYo("Comes Later")}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{tYo("For now the app drops a pin for each farm. Walking the field boundary with the farmer comes later.")}</p>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">4</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">{tYo("Follow-Up Visits")}</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">{tYo("Planned")}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{tYo("Planned: check on hired work and pest problems with farmers in your area.")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="px-margin-desktop py-space-xl max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-space-xs max-w-3xl mb-space-lg">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">{tYo("§4.12 Master Architecture")}</span>
            <h2 className="font-headline-lg text-headline-lg text-primary">{tYo("Trust, Verification & Safety Framework")}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">{tYo("Here is how we check people, handle payments and protect your data in the pilot, and what is still coming.")}</p>
          </div>
          <div className="mb-space-xl">
            <div className="flex items-center justify-between mb-space-md">
              <h3 className="font-headline-md text-headline-md text-on-surface">{tYo("Tiered Participant Verification Matrix")}</h3>
              <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Checks through a licensed verification provider")}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
              <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-space-sm">
                    <span className="font-label-sm text-label-sm font-bold text-on-surface-variant">{tYo("TIER 0")}</span>
                    <span className="px-space-xs py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface-variant">{tYo("Read Only")}</span>
                  </div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface mb-space-xs">{tYo("Phone Registered")}</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Basic SMS OTP signup. Allows browsing public marketplace prices, weather forecasts, and crop guides.")}</p>
                </div>
                <div className="pt-space-md mt-space-md bg-surface-container-low rounded-lg p-space-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">{tYo("Capabilities:")}</span>
                  <span className="font-label-sm text-label-sm font-semibold text-primary">{tYo("Browse listings; no transactions or tractor bookings permitted.")}</span>
                </div>
              </div>
              <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-space-sm">
                    <span className="font-label-sm text-label-sm font-bold text-secondary">{tYo("TIER 1")}</span>
                    <span className="px-space-xs py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-secondary font-semibold">{tYo("Active Smallholder")}</span>
                  </div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface mb-space-xs">{tYo("NIN Verified")}</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("NIN checked through a licensed verification provider, with your consent.")}</p>
                </div>
                <div className="pt-space-md mt-space-md bg-surface-container-low rounded-lg p-space-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">{tYo("Capabilities:")}</span>
                  <span className="font-label-sm text-label-sm font-semibold text-primary">{tYo("Add your farm and request tractor or farm-hand hire.")}</span>
                </div>
              </div>
              <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-space-sm">
                    <span className="font-label-sm text-label-sm font-bold text-primary">{tYo("TIER 2")}</span>
                    <span className="px-space-xs py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-primary font-semibold">{tYo("Settlement Ready")}</span>
                  </div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface mb-space-xs">{tYo("BVN & Bank Verified")}</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Bank Verification Number (BVN) checked against your bank account name before you receive payments.")}</p>
                </div>
                <div className="pt-space-md mt-space-md bg-surface-container-low rounded-lg p-space-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">{tYo("Capabilities:")}</span>
                  <span className="font-label-sm text-label-sm font-semibold text-primary">{tYo("List equipment or services and receive payments.")}</span>
                </div>
              </div>
              <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-space-sm">
                    <span className="font-label-sm text-label-sm font-bold text-on-tertiary-container">{tYo("TIER 3")}</span>
                    <span className="px-space-xs py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-on-tertiary-container font-semibold">{tYo("Institutional")}</span>
                  </div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface mb-space-xs">{tYo("Business Accounts (Planned)")}</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Checks for registered businesses (CAC and TIN) are planned.")}</p>
                </div>
                <div className="pt-space-md mt-space-md bg-surface-container-low rounded-lg p-space-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">{tYo("Capabilities:")}</span>
                  <span className="font-label-sm text-label-sm font-semibold text-primary">{tYo("Larger buyer and fleet accounts (planned).")}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg mb-space-xl">
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-md flex flex-col justify-between">
              <div className="flex flex-col gap-space-sm">
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                  <Icon name="verified" className="text-[24px]" />
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">{tYo("What \"Proof of Work\" (PoW) Means")}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Proof of work is coming soon. Here is what it will include:")}</p>
                <ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant mt-space-xs">
                  <li className="flex items-start gap-space-xs">
                    <Icon name="check_circle" className="text-secondary text-[18px] shrink-0" />
                    <span><strong>{tYo("Check-in:")}</strong>{tYo(" The provider checks in on their phone at the farm.")}</span>
                  </li>
                  <li className="flex items-start gap-space-xs">
                    <Icon name="check_circle" className="text-secondary text-[18px] shrink-0" />
                    <span><strong>{tYo("Photos:")}</strong>{tYo(" Photos of the work, each with its location and time.")}</span>
                  </li>
                  <li className="flex items-start gap-space-xs">
                    <Icon name="check_circle" className="text-secondary text-[18px] shrink-0" />
                    <span><strong>{tYo("Ratings:")}</strong>{tYo(" Farmers rate completed jobs.")}</span>
                  </li>
                </ul>
              </div>
              <div className="mt-space-md p-space-xs bg-surface-container rounded-lg font-label-sm text-label-sm text-on-surface-variant">{tYo("Coming soon, not live in the pilot yet.")}</div>
            </div>
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-md flex flex-col justify-between">
              <div className="flex flex-col gap-space-sm">
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                  <Icon name="account_balance" className="text-[24px]" />
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">{tYo("Pilot Payments")}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("How money moves during the pilot:")}</p>
                <ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant mt-space-xs">
                  <li className="flex items-start gap-space-xs">
                    <Icon name="account_balance_wallet" className="text-secondary text-[18px] shrink-0" />
                    <span><strong>{tYo("No Platform Fee on Hires:")}</strong>{tYo(" During the pilot, farmers pay providers directly, so there is no platform fee on hires.")}</span>
                  </li>
                  <li className="flex items-start gap-space-xs">
                    <Icon name="account_balance_wallet" className="text-secondary text-[18px] shrink-0" />
                    <span><strong>{tYo("Escrow (Coming):")}</strong>{tYo(" Money held until you confirm the job, coming once a licensed payment partner is signed.")}</span>
                  </li>
                  <li className="flex items-start gap-space-xs">
                    <Icon name="account_balance_wallet" className="text-secondary text-[18px] shrink-0" />
                    <span><strong>{tYo("Marketplace:")}</strong>{tYo(" Buyers pay at checkout by card, bank transfer or USSD through a licensed payment provider.")}</span>
                  </li>
                </ul>
              </div>
              <div className="mt-space-md p-space-xs bg-surface-container rounded-lg font-label-sm text-label-sm text-on-surface-variant">{tYo("We will name the licensed escrow partner here once the agreement is signed.")}</div>
            </div>
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-md flex flex-col justify-between">
              <div className="flex flex-col gap-space-sm">
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-tertiary">
                  <Icon name="balance" className="text-[24px]" />
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">{tYo("When a Job Goes Wrong")}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("What you can do in the pilot, and what is coming:")}</p>
                <ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant mt-space-xs">
                  <li className="flex items-start gap-space-xs">
                    <Icon name="schedule" className="text-secondary text-[18px] shrink-0" />
                    <span><strong>{tYo("Contact Us:")}</strong>{tYo(" Tell us what happened through the contact page.")}</span>
                  </li>
                  <li className="flex items-start gap-space-xs">
                    <Icon name="lock_clock" className="text-secondary text-[18px] shrink-0" />
                    <span><strong>{tYo("Payment Holds:")}</strong>{tYo(" Holding payment during a dispute needs escrow, which is coming once a licensed payment partner is signed.")}</span>
                  </li>
                  <li className="flex items-start gap-space-xs">
                    <Icon name="fact_check" className="text-secondary text-[18px] shrink-0" />
                    <span><strong>{tYo("Ratings:")}</strong>{tYo(" Ratings on completed jobs are coming soon.")}</span>
                  </li>
                </ul>
              </div>
              <div className="mt-space-md p-space-xs bg-surface-container rounded-lg font-label-sm text-label-sm text-on-surface-variant">{tYo("There is no formal dispute process yet; it will come with escrow.")}</div>
            </div>
          </div>
          <div className="rounded-xl bg-surface-container-low p-space-lg shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">
              <div className="lg:col-span-8 flex flex-col gap-space-sm">
                <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-secondary uppercase font-semibold">
                  <Icon name="security" className="text-[18px]" />
                  <span>{tYo("Nigeria Data Protection Act (NDPA 2023)")}</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-primary">{tYo("Your Farm Data Belongs to You")}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{tYo("We follow the Nigeria Data Protection Act 2023: we ask for consent before ID checks, store only masked ID numbers, and you can ask to download or delete your data.")}</p>
                <div className="flex flex-wrap items-center gap-space-md pt-space-xs font-label-sm text-label-sm text-on-surface">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary" />{tYo("Download Your Data")}</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary" />{tYo("Consent Before ID Checks")}</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary" />{tYo("Ask Us to Delete Your Data")}</span>
                </div>
              </div>
              <div className="lg:col-span-4 flex flex-col gap-space-xs bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">{tYo("Data Questions")}</span>
                <span className="font-headline-sm text-headline-sm text-primary">{tYo("Use the contact page")}</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("CultivaNode is run by Excel Palace Global Concept (BN 7455859), a business name registered with the Corporate Affairs Commission.")}</p>
              </div>
            </div>
          </div>
        </section>
        <section className="px-margin-desktop py-space-xl max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-space-xs max-w-2xl mb-space-lg">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">{tYo("Frequently Asked Questions")}</span>
            <h2 className="font-headline-lg text-headline-lg text-primary">{tYo("Operational Questions & Edge Cases")}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">{tYo("Clear, unvarnished policies addressing real-world complexities across South-West Nigerian farmland.")}</p>
          </div>
          <div className="flex flex-col gap-space-sm max-w-4xl">
            <details className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden group">
              <summary className="w-full p-space-md text-left flex items-center justify-between gap-space-sm hover:bg-surface-container-low transition-colors list-none [&::-webkit-details-marker]:hidden">
                <span className="font-headline-sm text-headline-sm text-on-surface">{tYo("What happens if a tractor arrives late or breaks down in my field?")}</span>
                <Icon name="expand_more" className="text-primary text-[24px] transition-transform duration-200" />
              </summary>
              <div className="hidden px-space-md pb-space-md pt-0 text-on-surface-variant font-body-sm text-body-sm leading-relaxed" id="faq-1">{tYo("During the pilot you agree the job and pay the tractor owner directly, so talk to the owner first and tell us through the contact page if it is not sorted out. Automatic refunds need escrow, which is coming once a licensed payment partner is signed.")}</div>
            </details>
            <details className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden group">
              <summary className="w-full p-space-md text-left flex items-center justify-between gap-space-sm hover:bg-surface-container-low transition-colors list-none [&::-webkit-details-marker]:hidden">
                <span className="font-headline-sm text-headline-sm text-on-surface">{tYo("How do I know the seed batches in the marketplace are not counterfeit?")}</span>
                <Icon name="expand_more" className="text-primary text-[24px] transition-transform duration-200" />
              </summary>
              <div className="hidden px-space-md pb-space-md pt-0 text-on-surface-variant font-body-sm text-body-sm leading-relaxed" id="faq-2">{tYo("We cannot yet confirm seed batches for you. Sellers who receive payments are checked with their NIN, BVN and bank account, but seed certificate checks and QR batch tags are planned, not live. Buy from sellers you trust and keep your receipts.")}</div>
            </details>
            <details className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden group">
              <summary className="w-full p-space-md text-left flex items-center justify-between gap-space-sm hover:bg-surface-container-low transition-colors list-none [&::-webkit-details-marker]:hidden">
                <span className="font-headline-sm text-headline-sm text-on-surface">{tYo("Can a commercial bank or government agency see my harvest records without permission?")}</span>
                <Icon name="expand_more" className="text-primary text-[24px] transition-transform duration-200" />
              </summary>
              <div className="hidden px-space-md pb-space-md pt-0 text-on-surface-variant font-body-sm text-body-sm leading-relaxed" id="faq-3">{tYo("Not without your consent. We follow the Nigeria Data Protection Act 2023: we ask for consent before ID checks, store only masked ID numbers, and you can ask to download or delete your data. Sharing farm records with lenders is not part of the pilot.")}</div>
            </details>
            <details className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden group">
              <summary className="w-full p-space-md text-left flex items-center justify-between gap-space-sm hover:bg-surface-container-low transition-colors list-none [&::-webkit-details-marker]:hidden">
                <span className="font-headline-sm text-headline-sm text-on-surface">{tYo("How are disputes resolved if produce is rejected at the buyer's weighbridge?")}</span>
                <Icon name="expand_more" className="text-primary text-[24px] transition-transform duration-200" />
              </summary>
              <div className="hidden px-space-md pb-space-md pt-0 text-on-surface-variant font-body-sm text-body-sm leading-relaxed" id="faq-4">{tYo("Weighbridge checks and quality inspections are planned, not live. For now, agree quality and quantity with the buyer before delivery, and tell us through the contact page if something goes wrong.")}</div>
            </details>
          </div>
        </section>
        <section className="px-margin-desktop py-space-xl max-w-7xl mx-auto w-full">
          <div className="rounded-xl bg-primary text-on-primary p-space-xl flex flex-col md:flex-row md:items-center justify-between gap-space-lg shadow-xl relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-secondary opacity-10 pointer-events-none blur-2xl" />
            <div className="flex flex-col gap-space-xs max-w-2xl relative z-10">
              <div className="flex items-center gap-space-xs font-label-sm text-label-sm uppercase tracking-wider text-secondary-fixed font-semibold">
                <span className="w-2 h-2 rounded-full bg-secondary-fixed" />
                <span>{tYo("South-West Nigeria Pilot")}</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-primary md:text-[2rem] md:leading-[2.5rem]">{tYo("Join the Pilot")}</h2>
              <p className="font-body-md text-body-md text-on-primary-container leading-relaxed">{tYo("Hire verified tractor owners and farm hands, plan your crops and keep your farm books, with no platform fee on hires during the pilot. Whether you farm 2 hectares or own tractors, you can sign up today.")}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-space-sm shrink-0 relative z-10">
              <Link className="w-full sm:w-auto inline-flex items-center justify-center font-label-lg text-label-lg font-semibold bg-secondary text-on-secondary px-space-lg py-space-sm rounded-lg hover:bg-secondary-fixed transition-colors shadow-md" href={`/${lang}/sign-up`}>{tYo("Create Free Account")}</Link>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- downloads a file from an API route, not a page */}
              <a className="w-full sm:w-auto inline-flex items-center justify-center gap-space-xs font-label-lg text-label-lg font-semibold bg-surface-container-lowest text-primary px-space-md py-space-sm rounded-lg hover:bg-surface-container transition-colors shadow-sm" href="/api/documents/handbook?download=1">
                <Icon name="download" className="text-[18px]" />
                <span>{tYo("Pilot Trust Handbook (PDF)")}</span>
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
