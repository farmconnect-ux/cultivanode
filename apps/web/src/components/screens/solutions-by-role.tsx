"use client";

// Ported from the "solutions_by_agricultural_role_cultivanode" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import { showScreenToast } from "@/components/ds/screen-dialog";
import type { ScreenProps } from "./types";
import { phrasebook } from "@/i18n/marketing";
import YO from "@/i18n/yo-marketing/solutions-by-role";

const tYo = phrasebook(YO);

export function SolutionsByRole({ lang }: ScreenProps) {
  const [activeFilter, setActiveFilter] = useState("all");

  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <section className="relative w-full bg-surface-container-low overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-margin-desktop pt-space-xl pb-space-xl relative">
            <div className="flex flex-col gap-space-md max-w-4xl">
              <div className="inline-flex items-center gap-space-sm self-start bg-surface-container-lowest shadow-sm px-space-sm py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">{tYo("TAILORED AGRARIAN ECOSYSTEM · /en/solutions")}</span>
                <span className="text-outline-variant font-body-sm text-body-sm">|</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">{tYo("We Follow NDPA 2023")}</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight">{tYo("Engineered for Every Stakeholder in the Agricultural Value Chain")}</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">{tYo("From smallholders planting cassava to tractor owners, farm hands and produce buyers, see how CultivaNode can help with your daily work. We are in a pilot in South-West Nigeria; planned features are marked.")}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-md pt-space-sm">
                <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">{tYo("Pilot States")}</span>
                  <span className="font-headline-lg text-headline-lg text-primary font-bold">6<span className="font-label-md text-label-md font-medium text-secondary ml-1">{tYo("States")}</span></span>
                </div>
                <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">{tYo("Crop Calendars")}</span>
                  <span className="font-headline-lg text-headline-lg text-primary font-bold">15<span className="font-label-md text-label-md font-medium text-secondary ml-1">{tYo("Crops")}</span></span>
                </div>
                <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">{tYo("Weather Forecast")}</span>
                  <span className="font-headline-lg text-headline-lg text-primary font-bold">10<span className="font-label-md text-label-md font-medium text-secondary ml-1">{tYo("Days")}</span></span>
                </div>
                <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">{tYo("Assistant Languages")}</span>
                  <span className="font-headline-lg text-headline-lg text-primary font-bold">3<span className="font-label-md text-label-md font-medium text-secondary ml-1">{tYo("Languages")}</span></span>
                </div>
              </div>
            </div>
            <div className="mt-space-xl pt-space-lg">
              <div className="flex items-center justify-between pb-space-sm">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">{tYo("Filter by Operational Category")}</span>
                <span className="font-label-sm text-label-sm text-secondary font-medium">{tYo("9 Calibrated Architecture Profiles")}</span>
              </div>
              <div className="flex flex-wrap gap-space-xs" id="role-filter-container">
                <button
                  className={`filter-pill px-space-md py-space-xs rounded-full font-label-md text-label-md transition-all flex items-center gap-1.5 ${activeFilter === "all" ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"}`}
                  data-filter="all"
                  type="button"
                  onClick={() => {
                    setActiveFilter("all");
                    showScreenToast(tYo.now("Displaying all 9 agricultural stakeholder solution profiles."));
                  }}
                >
                  <Icon name="apps" className="text-[16px]" />{tYo(" All Roles (9)")}</button>
                <button
                  className={`filter-pill px-space-md py-space-xs rounded-full font-label-md text-label-md transition-all flex items-center gap-1.5 ${activeFilter === "production" ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"}`}
                  data-filter="production"
                  type="button"
                  onClick={() => {
                    setActiveFilter("production");
                    showScreenToast(tYo.now("Filtered to Farmers & Commercial Producers."));
                  }}
                >
                  <Icon name="agriculture" className="text-[16px] text-secondary" />{tYo(" Farmers & Operators")}</button>
                <button
                  className={`filter-pill px-space-md py-space-xs rounded-full font-label-md text-label-md transition-all flex items-center gap-1.5 ${activeFilter === "machinery" ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"}`}
                  data-filter="machinery"
                  type="button"
                  onClick={() => {
                    setActiveFilter("machinery");
                    showScreenToast(tYo.now("Filtered to Machinery Fleet Owners & Syndicates."));
                  }}
                >
                  <Icon name="precision_manufacturing" className="text-[16px] text-secondary" />{tYo(" Machinery Fleet Owners")}</button>
                <button
                  className={`filter-pill px-space-md py-space-xs rounded-full font-label-md text-label-md transition-all flex items-center gap-1.5 ${activeFilter === "services" ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"}`}
                  data-filter="services"
                  type="button"
                  onClick={() => {
                    setActiveFilter("services");
                    showScreenToast(tYo.now("Filtered to Agronomic & Field Service Providers."));
                  }}
                >
                  <Icon name="badge" className="text-[16px] text-secondary" />{tYo(" Service Providers")}</button>
                <button
                  className={`filter-pill px-space-md py-space-xs rounded-full font-label-md text-label-md transition-all flex items-center gap-1.5 ${activeFilter === "inputs" ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"}`}
                  data-filter="inputs"
                  type="button"
                  onClick={() => {
                    setActiveFilter("inputs");
                    showScreenToast(tYo.now("Filtered to Agro-Dealers & Chemical Stockists."));
                  }}
                >
                  <Icon name="storefront" className="text-[16px] text-secondary" />{tYo(" Agro-Dealers")}</button>
                <button
                  className={`filter-pill px-space-md py-space-xs rounded-full font-label-md text-label-md transition-all flex items-center gap-1.5 ${activeFilter === "offtake" ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"}`}
                  data-filter="offtake"
                  type="button"
                  onClick={() => {
                    setActiveFilter("offtake");
                    showScreenToast(tYo.now("Filtered to Commodity Buyers & Corporate Off-takers."));
                  }}
                >
                  <Icon name="local_shipping" className="text-[16px] text-secondary" />{tYo(" Commodity Buyers")}</button>
                <button
                  className={`filter-pill px-space-md py-space-xs rounded-full font-label-md text-label-md transition-all flex items-center gap-1.5 ${activeFilter === "logistics" ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"}`}
                  data-filter="logistics"
                  type="button"
                  onClick={() => {
                    setActiveFilter("logistics");
                    showScreenToast(tYo.now("Filtered to Haulage & Reefer Logistics Fleets."));
                  }}
                >
                  <Icon name="rv_hookup" className="text-[16px] text-secondary" />{tYo(" Logistics")}</button>
                <button
                  className={`filter-pill px-space-md py-space-xs rounded-full font-label-md text-label-md transition-all flex items-center gap-1.5 ${activeFilter === "federations" ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"}`}
                  data-filter="federations"
                  type="button"
                  onClick={() => {
                    setActiveFilter("federations");
                    showScreenToast(tYo.now("Filtered to Agricultural Cooperatives & Guilds."));
                  }}
                >
                  <Icon name="groups" className="text-[16px] text-secondary" />{tYo(" Cooperatives")}</button>
                <button
                  className={`filter-pill px-space-md py-space-xs rounded-full font-label-md text-label-md transition-all flex items-center gap-1.5 ${activeFilter === "institutional" ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"}`}
                  data-filter="institutional"
                  type="button"
                  onClick={() => {
                    setActiveFilter("institutional");
                    showScreenToast(tYo.now("Filtered to Institutional Lenders, Donors & Government."));
                  }}
                >
                  <Icon name="account_balance" className="text-[16px] text-secondary" />{tYo(" Institutions")}</button>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full max-w-7xl mx-auto px-margin-desktop py-space-xl">
          <div className="flex flex-col gap-space-lg">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
              <div>
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">{tYo("SYSTEMATIC ROLE DIRECTORY")}</span>
                <h2 className="font-headline-lg text-headline-lg text-primary">{tYo("Calibrated Workflows by Value Chain Position")}</h2>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">{tYo("Each card shows common problems for the role, what CultivaNode offers, and whether it is in the pilot or planned.")}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg" id="solutions-card-grid">
              <div className="solution-card group flex flex-col bg-surface-container-lowest rounded-lg shadow-sm hover:shadow-md transition-all p-space-lg relative overflow-hidden" data-category="production">
                <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-low -mx-space-lg -mt-space-lg px-space-lg pt-space-md">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="potted_plant" className="text-primary text-[24px]" />
                    <span className="font-label-sm text-label-sm font-bold text-primary">{tYo("§4.3 FRAMEWORK")}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-bold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />{tYo(" In the Pilot")}</span>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-md text-headline-md text-primary">{tYo("Smallholder & Family Farmers")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Independent growers cultivating 0.5 to 10 hectares across South-West food belts who need timely machinery and better market access.")}</p>
                </div>
                <div className="mt-space-md p-space-sm rounded-lg bg-error-container/40 flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-on-error-container uppercase font-bold flex items-center gap-1"><Icon name="report_problem" className="text-[15px]" />{tYo(" Key Operational Bottlenecks")}</span>
                  <p className="font-body-sm text-body-sm text-on-surface">{tYo("Tractor scarcity during short onset rains, adulterated seed supplies, lack of formal bankable credit records, and vulnerability to exploitative farmgate cartels.")}</p>
                </div>
                <div className="mt-space-md flex flex-col gap-space-xs flex-grow">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-semibold">{tYo("Native Platform Capabilities")}</span>
                  <ul className="flex flex-col gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("Drop a pin for your farm (boundary walking comes later)")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("Crop calendars for 15 common South-West crops")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("Hire tractors and farm hands nearby; no platform fee on pilot hires")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("10-day weather forecast for your farm")}</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-space-md p-space-sm bg-surface-container-low rounded-lg">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase font-bold block mb-1">{tYo("Standardized Workflow:")}</span>
                  <div className="flex items-center justify-between text-[11px] font-label-sm text-primary font-medium">
                    <span>{tYo("Pin Farm")}</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>{tYo("Crop Schedule")}</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>{tYo("Book Tractor")}</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>{tYo("Farm Books")}</span>
                  </div>
                </div>
                <div className="mt-space-lg pt-space-sm">
                  <Link className="w-full inline-flex items-center justify-center gap-space-xs bg-primary-container text-on-primary py-space-sm px-space-md rounded-lg font-label-lg text-label-lg font-semibold hover:bg-primary transition-colors shadow-sm" href={`/${lang}/sign-up`}>
                    <span>{tYo("Start as Farmer")}</span>
                    <Icon name="east" className="text-[18px]" />
                  </Link>
                </div>
              </div>
              <div className="solution-card group flex flex-col bg-surface-container-lowest rounded-lg shadow-sm hover:shadow-md transition-all p-space-lg relative overflow-hidden" data-category="production">
                <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-low -mx-space-lg -mt-space-lg px-space-lg pt-space-md">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="domain" className="text-primary text-[24px]" />
                    <span className="font-label-sm text-label-sm font-bold text-primary">{tYo("§4.6 FRAMEWORK")}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-bold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />{tYo(" In the Pilot")}</span>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-md text-headline-md text-primary">{tYo("Commercial Farms & Agribusinesses")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Multi-hectare industrial estates (50–5,000+ Ha) operating dispersed agrarian parcels with dedicated agronomy, accounting, and security teams.")}</p>
                </div>
                <div className="mt-space-md p-space-sm rounded-lg bg-error-container/40 flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-on-error-container uppercase font-bold flex items-center gap-1"><Icon name="report_problem" className="text-[15px]" />{tYo(" Key Operational Bottlenecks")}</span>
                  <p className="font-body-sm text-body-sm text-on-surface">{tYo("Uncontrolled diesel pilferage, disconnected field-worker logs, chaotic spreadsheet rosters, and opaque real-time cost-per-hectare variance.")}</p>
                </div>
                <div className="mt-space-md flex flex-col gap-space-xs flex-grow">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-semibold">{tYo("Native Platform Capabilities")}</span>
                  <ul className="flex flex-col gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("One dashboard for your farm work (multi-estate view planned)")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("Team roles for managers, agronomists and storekeepers (planned)")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("Store and inventory records")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("Farm books for income, costs and harvest")}</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-space-md p-space-sm bg-surface-container-low rounded-lg">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase font-bold block mb-1">{tYo("Standardized Workflow:")}</span>
                  <div className="flex items-center justify-between text-[11px] font-label-sm text-primary font-medium">
                    <span>{tYo("Org Setup")}</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>{tYo("Add Farms")}</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>{tYo("Issue Stock")}</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>{tYo("Farm Books")}</span>
                  </div>
                </div>
                <div className="mt-space-lg pt-space-sm">
                  <Link className="w-full inline-flex items-center justify-center gap-space-xs bg-primary-container text-on-primary py-space-sm px-space-md rounded-lg font-label-lg text-label-lg font-semibold hover:bg-primary transition-colors shadow-sm" href={`/${lang}/solutions`}>
                    <span>{tYo("Explore Enterprise Solutions")}</span>
                    <Icon name="east" className="text-[18px]" />
                  </Link>
                </div>
              </div>
              <div className="solution-card group flex flex-col bg-surface-container-lowest rounded-lg shadow-sm hover:shadow-md transition-all p-space-lg relative overflow-hidden" data-category="machinery">
                <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-low -mx-space-lg -mt-space-lg px-space-lg pt-space-md">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="cloud_download" className="text-primary text-[24px]" />
                    <span className="font-label-sm text-label-sm font-bold text-primary">{tYo("§4.4 FRAMEWORK")}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-bold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />{tYo(" In the Pilot · No Fee on Hires")}</span>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-md text-headline-md text-primary">{tYo("Machinery Fleet Owners & Syndicates")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Tractor proprietors, implement fabricators, and commercial hiring syndicates operating plows, harrows, ridges, and combined harvesters.")}</p>
                </div>
                <div className="mt-space-md p-space-sm rounded-lg bg-error-container/40 flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-on-error-container uppercase font-bold flex items-center gap-1"><Icon name="report_problem" className="text-[15px]" />{tYo(" Key Operational Bottlenecks")}</span>
                  <p className="font-body-sm text-body-sm text-on-surface">{tYo("Costly idle downtime between scattered orders, chronic payment defaults by farmers, excessive dead-mile transit, and endless disputes on acreage completed.")}</p>
                </div>
                <div className="mt-space-md flex flex-col gap-space-xs flex-grow">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-semibold">{tYo("Native Platform Capabilities")}</span>
                  <ul className="flex flex-col gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("List your tractors and implements; owners are checked with NIN, BVN and bank account")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("Proof of work (check-in + photos with location and time), coming soon")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("In the pilot the farmer pays you directly; escrow comes once a licensed payment partner is signed")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("Get hire requests from farmers near you")}</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-space-md p-space-sm bg-surface-container-low rounded-lg">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase font-bold block mb-1">{tYo("Standardized Workflow:")}</span>
                  <div className="flex items-center justify-between text-[11px] font-label-sm text-primary font-medium">
                    <span>{tYo("List Fleet")}</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>{tYo("Accept Jobs")}</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>{tYo("Do the Job")}</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>{tYo("Get Paid Directly")}</span>
                  </div>
                </div>
                <div className="mt-space-lg pt-space-sm">
                  <Link className="w-full inline-flex items-center justify-center gap-space-xs bg-primary-container text-on-primary py-space-sm px-space-md rounded-lg font-label-lg text-label-lg font-semibold hover:bg-primary transition-colors shadow-sm" href={`/${lang}/sign-up`}>
                    <span>{tYo("Register Equipment Fleet")}</span>
                    <Icon name="east" className="text-[18px]" />
                  </Link>
                </div>
              </div>
              <div className="solution-card group flex flex-col bg-surface-container-lowest rounded-lg shadow-sm hover:shadow-md transition-all p-space-lg relative overflow-hidden" data-category="services">
                <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-low -mx-space-lg -mt-space-lg px-space-lg pt-space-md">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="engineering" className="text-primary text-[24px]" />
                    <span className="font-label-sm text-label-sm font-bold text-primary">{tYo("§4.5 FRAMEWORK")}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-bold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />{tYo(" In the Pilot")}</span>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-md text-headline-md text-primary">{tYo("Skilled Agricultural Service Providers")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Independent spray applicators, pruning specialists, ridging gangs, soil analysts and other farm hands.")}</p>
                </div>
                <div className="mt-space-md p-space-sm rounded-lg bg-error-container/40 flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-on-error-container uppercase font-bold flex items-center gap-1"><Icon name="report_problem" className="text-[15px]" />{tYo(" Key Operational Bottlenecks")}</span>
                  <p className="font-body-sm text-body-sm text-on-surface">{tYo("Irregular gig availability, delayed daily wage disbursements, safety risks without training verification, and zero verifiable credentials to command higher rates.")}</p>
                </div>
                <div className="mt-space-md flex flex-col gap-space-xs flex-grow">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-semibold">{tYo("Native Platform Capabilities")}</span>
                  <ul className="flex flex-col gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("Verified profile (NIN, BVN and bank account checks)")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("Get hire requests from farmers near you")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("Rate cards for hectare and day work (planned)")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("Proof of work (check-in + photos with location and time), coming soon")}</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-space-md p-space-sm bg-surface-container-low rounded-lg">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase font-bold block mb-1">{tYo("Standardized Workflow:")}</span>
                  <div className="flex items-center justify-between text-[11px] font-label-sm text-primary font-medium">
                    <span>{tYo("Verify ID")}</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>{tYo("Job Alerts")}</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>{tYo("Execute Task")}</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>{tYo("Get Paid Directly")}</span>
                  </div>
                </div>
                <div className="mt-space-lg pt-space-sm">
                  <Link className="w-full inline-flex items-center justify-center gap-space-xs bg-primary-container text-on-primary py-space-sm px-space-md rounded-lg font-label-lg text-label-lg font-semibold hover:bg-primary transition-colors shadow-sm" href={`/${lang}/sign-up`}>
                    <span>{tYo("Join Provider Network")}</span>
                    <Icon name="east" className="text-[18px]" />
                  </Link>
                </div>
              </div>
              <div className="solution-card group flex flex-col bg-surface-container-lowest rounded-lg shadow-sm hover:shadow-md transition-all p-space-lg relative overflow-hidden" data-category="inputs">
                <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-low -mx-space-lg -mt-space-lg px-space-lg pt-space-md">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="storefront" className="text-primary text-[24px]" />
                    <span className="font-label-sm text-label-sm font-bold text-primary">{tYo("§6.2 FRAMEWORK")}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-bold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />{tYo(" In the Pilot")}</span>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-md text-headline-md text-primary">{tYo("Input Suppliers & Agro-Dealers")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Distributors and licensed merchants of certified seeds, NPK/urea fertilizers, bio-pesticides, and smallholder farming tools across regional towns.")}</p>
                </div>
                <div className="mt-space-md p-space-sm rounded-lg bg-error-container/40 flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-on-error-container uppercase font-bold flex items-center gap-1"><Icon name="report_problem" className="text-[15px]" />{tYo(" Key Operational Bottlenecks")}</span>
                  <p className="font-body-sm text-body-sm text-on-surface">{tYo("Unfair competition from fake inputs damaging customer trust, unexpected inventory expiries, bad customer credit risk, and expensive rural last-mile delivery.")}</p>
                </div>
                <div className="mt-space-md flex flex-col gap-space-xs flex-grow">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-semibold">{tYo("Native Platform Capabilities")}</span>
                  <ul className="flex flex-col gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("Sellers who receive payments are checked with NIN, BVN and bank account")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("List your products on the marketplace")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("Batch QR traceability (planned)")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("Buyers pay at checkout by card, bank transfer or USSD through a licensed payment provider")}</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-space-md p-space-sm bg-surface-container-low rounded-lg">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase font-bold block mb-1">{tYo("Standardized Workflow:")}</span>
                  <div className="flex items-center justify-between text-[11px] font-label-sm text-primary font-medium">
                    <span>{tYo("List Products")}</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>{tYo("Get Orders")}</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>{tYo("Fulfill Orders")}</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>{tYo("Get Paid")}</span>
                  </div>
                </div>
                <div className="mt-space-lg pt-space-sm">
                  <Link className="w-full inline-flex items-center justify-center gap-space-xs bg-primary-container text-on-primary py-space-sm px-space-md rounded-lg font-label-lg text-label-lg font-semibold hover:bg-primary transition-colors shadow-sm" href={`/${lang}/sign-up`}>
                    <span>{tYo("Onboard Agro-dealership")}</span>
                    <Icon name="east" className="text-[18px]" />
                  </Link>
                </div>
              </div>
              <div className="solution-card group flex flex-col bg-surface-container-lowest rounded-lg shadow-sm hover:shadow-md transition-all p-space-lg relative overflow-hidden" data-category="offtake">
                <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-low -mx-space-lg -mt-space-lg px-space-lg pt-space-md">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="factory" className="text-primary text-[24px]" />
                    <span className="font-label-sm text-label-sm font-bold text-primary">{tYo("§6.4 FRAMEWORK")}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-bold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />{tYo(" In the Pilot")}</span>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-md text-headline-md text-primary">{tYo("Produce Buyers & Food Processors")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Starch manufacturers, flour millers, feed mills, breweries, and institutional bulk purchasers sourcing clean grain and tuber volumes.")}</p>
                </div>
                <div className="mt-space-md p-space-sm rounded-lg bg-error-container/40 flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-on-error-container uppercase font-bold flex items-center gap-1"><Icon name="report_problem" className="text-[15px]" />{tYo(" Key Operational Bottlenecks")}</span>
                  <p className="font-body-sm text-body-sm text-on-surface">{tYo("Unreliable moisture specifications, hidden sand/stone adulteration, erratic supply timetables, and multi-layered broker markups inflating procurement costs.")}</p>
                </div>
                <div className="mt-space-md flex flex-col gap-space-xs flex-grow">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-semibold">{tYo("Native Platform Capabilities")}</span>
                  <ul className="flex flex-col gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("Browse produce listed by farmers on the marketplace")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("Moisture and aflatoxin certificates (planned)")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("Pay at checkout by card, bank transfer or USSD through a licensed payment provider")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("Forward contracts (planned)")}</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-space-md p-space-sm bg-surface-container-low rounded-lg">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase font-bold block mb-1">{tYo("Standardized Workflow:")}</span>
                  <div className="flex items-center justify-between text-[11px] font-label-sm text-primary font-medium">
                    <span>{tYo("Browse Produce")}</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>{tYo("Pay at Checkout")}</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>{tYo("Arrange Pickup")}</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>{tYo("Confirm Delivery")}</span>
                  </div>
                </div>
                <div className="mt-space-lg pt-space-sm">
                  <Link className="w-full inline-flex items-center justify-center gap-space-xs bg-primary-container text-on-primary py-space-sm px-space-md rounded-lg font-label-lg text-label-lg font-semibold hover:bg-primary transition-colors shadow-sm" href={`/${lang}/marketplace`}>
                    <span>{tYo("Access Wholesale Produce")}</span>
                    <Icon name="east" className="text-[18px]" />
                  </Link>
                </div>
              </div>
              <div className="solution-card group flex flex-col bg-surface-container-lowest rounded-lg shadow-sm hover:shadow-md transition-all p-space-lg relative overflow-hidden" data-category="logistics">
                <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-low -mx-space-lg -mt-space-lg px-space-lg pt-space-md">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="local_shipping" className="text-primary text-[24px]" />
                    <span className="font-label-sm text-label-sm font-bold text-primary">{tYo("§6.5 FRAMEWORK")}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-bold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />{tYo(" Planned")}</span>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-md text-headline-md text-primary">{tYo("Logistics & Haulage Operators")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Truck owners, flatbed haulers, and refrigerated van drivers transporting goods from remote farmgate pick-up points to city wholesale hubs.")}</p>
                </div>
                <div className="mt-space-md p-space-sm rounded-lg bg-error-container/40 flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-on-error-container uppercase font-bold flex items-center gap-1"><Icon name="report_problem" className="text-[15px]" />{tYo(" Key Operational Bottlenecks")}</span>
                  <p className="font-body-sm text-body-sm text-on-surface">{tYo("Costly empty backhauls from urban depots, inaccessible muddy rural feeder roads without prior notice, and high post-harvest perishability risks during vehicle breakdowns.")}</p>
                </div>
                <div className="mt-space-md flex flex-col gap-space-xs flex-grow">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-semibold">{tYo("Native Platform Capabilities")}</span>
                  <ul className="flex flex-col gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("On-demand dispatch matching farmgate harvest manifests to route capacity")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("Digital waybills with QR codes")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("Route planning with weather forecasts")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("Payment on delivery, once a licensed payment partner is signed")}</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-space-md p-space-sm bg-surface-container-low rounded-lg">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase font-bold block mb-1">{tYo("Standardized Workflow:")}</span>
                  <div className="flex items-center justify-between text-[11px] font-label-sm text-primary font-medium">
                    <span>{tYo("Add Trucks")}</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>{tYo("Match Loads")}</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>{tYo("QR Waybill")}</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>{tYo("Get Paid")}</span>
                  </div>
                </div>
                <div className="mt-space-lg pt-space-sm">
                  <Link className="w-full inline-flex items-center justify-center gap-space-xs bg-primary-container text-on-primary py-space-sm px-space-md rounded-lg font-label-lg text-label-lg font-semibold hover:bg-primary transition-colors shadow-sm" href={`/${lang}/sign-up`}>
                    <span>{tYo("Register Interest")}</span>
                    <Icon name="east" className="text-[18px]" />
                  </Link>
                </div>
              </div>
              <div className="solution-card group flex flex-col bg-surface-container-lowest rounded-lg shadow-sm hover:shadow-md transition-all p-space-lg relative overflow-hidden" data-category="federations">
                <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-low -mx-space-lg -mt-space-lg px-space-lg pt-space-md">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="diversity_3" className="text-primary text-[24px]" />
                    <span className="font-label-sm text-label-sm font-bold text-primary">{tYo("§10.2 FRAMEWORK")}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-container text-tertiary-container font-bold"><span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container" />{tYo(" Planned")}</span>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-md text-headline-md text-primary">{tYo("Cooperatives & Farmer Federations")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Registered apex agricultural unions, community credit societies, and communal farmer unions coordinating collective production.")}</p>
                </div>
                <div className="mt-space-md p-space-sm rounded-lg bg-error-container/40 flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-on-error-container uppercase font-bold flex items-center gap-1"><Icon name="report_problem" className="text-[15px]" />{tYo(" Key Operational Bottlenecks")}</span>
                  <p className="font-body-sm text-body-sm text-on-surface">{tYo("Chaotic paper-based member ledgers, complex bulk input distribution disputes, underutilized pooled tractors, and friction during shared harvest dividend disbursements.")}</p>
                </div>
                <div className="mt-space-md flex flex-col gap-space-xs flex-grow">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-semibold">{tYo("Native Platform Capabilities")}</span>
                  <ul className="flex flex-col gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("Member list with farm locations (planned)")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("Group input orders (planned)")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("Group machinery booking (planned)")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("Shared group payments (planned, with a licensed payment partner)")}</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-space-md p-space-sm bg-surface-container-low rounded-lg">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase font-bold block mb-1">{tYo("Standardized Workflow:")}</span>
                  <div className="flex items-center justify-between text-[11px] font-label-sm text-primary font-medium">
                    <span>{tYo("Enroll Group")}</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>{tYo("Pool Demand")}</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>{tYo("Deploy Fleet")}</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>{tYo("Split Revenue")}</span>
                  </div>
                </div>
                <div className="mt-space-lg pt-space-sm">
                  <Link className="w-full inline-flex items-center justify-center gap-space-xs bg-surface-container text-primary py-space-sm px-space-md rounded-lg font-label-lg text-label-lg font-semibold hover:bg-surface-container-high transition-colors shadow-sm" href={`/${lang}/solutions`}>
                    <span>{tYo("Connect Cooperative")}</span>
                    <Icon name="east" className="text-[18px]" />
                  </Link>
                </div>
              </div>
              <div className="solution-card group flex flex-col bg-surface-container-lowest rounded-lg shadow-sm hover:shadow-md transition-all p-space-lg relative overflow-hidden" data-category="institutional">
                <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-low -mx-space-lg -mt-space-lg px-space-lg pt-space-md">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="account_balance" className="text-primary text-[24px]" />
                    <span className="font-label-sm text-label-sm font-bold text-primary">§10.3 / §10.4 / §9.2</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-container-high text-primary font-bold"><span className="w-1.5 h-1.5 rounded-full bg-primary" />{tYo(" Institutional")}</span>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-md text-headline-md text-primary">{tYo("Institutions, Lenders & NGOs")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Commercial banks, state agricultural development programmes (ADPs), microfinance lenders, and international donor projects.")}</p>
                </div>
                <div className="mt-space-md p-space-sm rounded-lg bg-error-container/40 flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-on-error-container uppercase font-bold flex items-center gap-1"><Icon name="report_problem" className="text-[15px]" />{tYo(" Key Operational Bottlenecks")}</span>
                  <p className="font-body-sm text-body-sm text-on-surface">{tYo("Prevalence of 'ghost farmers' in subsidy programs, lack of verifiable historical yield dossiers for credit scoring, and unmonitored rural interventions.")}</p>
                </div>
                <div className="mt-space-md flex flex-col gap-space-xs flex-grow">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-semibold">{tYo("Native Platform Capabilities")}</span>
                  <ul className="flex flex-col gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("Area-level farm data shared only with farmer consent (planned)")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("Credit profiles from farm records (planned)")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("Input voucher programmes (planned)")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>{tYo("Anonymised reports that follow the Nigeria Data Protection Act 2023 (planned)")}</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-space-md p-space-sm bg-surface-container-low rounded-lg">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase font-bold block mb-1">{tYo("Standardized Workflow:")}</span>
                  <div className="flex items-center justify-between text-[11px] font-label-sm text-primary font-medium">
                    <span>{tYo("Scope Target")}</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>{tYo("Audit Plots")}</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>{tYo("Issue Voucher")}</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>{tYo("Track Yield")}</span>
                  </div>
                </div>
                <div className="mt-space-lg pt-space-sm">
                  <Link className="w-full inline-flex items-center justify-center gap-space-xs bg-primary text-on-primary py-space-sm px-space-md rounded-lg font-label-lg text-label-lg font-semibold hover:bg-primary-container transition-colors shadow-sm" href={`/${lang}/partners`}>
                    <span>{tYo("Partner with CultivaNode")}</span>
                    <Icon name="east" className="text-[18px]" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full bg-surface-container-low py-space-xl">
          <div className="max-w-7xl mx-auto px-margin-desktop flex flex-col gap-space-lg">
            <div className="flex flex-col gap-space-xs">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">{tYo("DEPLOYMENT ROADMAP & CAPABILITY MATRIX")}</span>
              <h2 className="font-headline-lg text-headline-lg text-primary">{tYo("Phase 1 Live Capabilities vs. Phased Extensions")}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">{tYo("The pilot runs in Oyo, Ogun, Osun, Ondo, Ekiti and Lagos. The table shows what is in the pilot now and what is planned for each role.")}</p>
            </div>
            <div className="w-full bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container font-label-sm text-label-sm text-on-surface uppercase tracking-wider">
                      <th className="py-space-md px-space-lg">{tYo("Stakeholder Role")}</th>
                      <th className="py-space-md px-space-md">{tYo("In the Pilot Now")}</th>
                      <th className="py-space-md px-space-md">{tYo("Planned Next")}</th>
                      <th className="py-space-md px-space-md">{tYo("Later")}</th>
                      <th className="py-space-md px-space-md text-right">{tYo("Escrow")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high/60 font-body-sm text-body-sm text-on-surface">
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-space-md px-space-lg font-semibold text-primary flex items-center gap-2"><Icon name="person" className="text-secondary text-[18px]" />{tYo(" Smallholder Farmers")}</td>
                      <td className="py-space-md px-space-md">
                        <span className="inline-flex items-center gap-1 text-secondary font-medium"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />{tYo("Farm Pin, Tractor Hire, Crop Calendars")}</span>
                      </td>
                      <td className="py-space-md px-space-md text-on-surface-variant">{tYo("USSD Offline Booking, Micro-crop insurance")}</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">{tYo("Cross-border export clearance")}</td>
                      <td className="py-space-md px-space-md text-right font-semibold text-primary">{tYo("Coming Later")}</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-space-md px-space-lg font-semibold text-primary flex items-center gap-2"><Icon name="domain" className="text-secondary text-[18px]" />{tYo(" Commercial Agribusiness")}</td>
                      <td className="py-space-md px-space-md">
                        <span className="inline-flex items-center gap-1 text-secondary font-medium"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />{tYo("Store & Inventory, Farm Books")}</span>
                      </td>
                      <td className="py-space-md px-space-md text-on-surface-variant">{tYo("ERP API Integrations (SAP/QuickBooks)")}</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">{tYo("Automated Drone NDVI Analysis")}</td>
                      <td className="py-space-md px-space-md text-right font-semibold text-primary">{tYo("Coming Later")}</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-space-md px-space-lg font-semibold text-primary flex items-center gap-2"><Icon name="precision_manufacturing" className="text-secondary text-[18px]" />{tYo(" Machinery Syndicates")}</td>
                      <td className="py-space-md px-space-md">
                        <span className="inline-flex items-center gap-1 text-secondary font-medium"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />{tYo("Equipment Listing, Hire Requests")}</span>
                      </td>
                      <td className="py-space-md px-space-md text-on-surface-variant">{tYo("Telematics CAN-bus Fuel Sensors")}</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">{tYo("Autonomous Tractor Pilot Rails")}</td>
                      <td className="py-space-md px-space-md text-right font-semibold text-primary">{tYo("Coming Later")}</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-space-md px-space-lg font-semibold text-primary flex items-center gap-2"><Icon name="badge" className="text-secondary text-[18px]" />{tYo(" Ag Service Providers")}</td>
                      <td className="py-space-md px-space-md">
                        <span className="inline-flex items-center gap-1 text-secondary font-medium"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />{tYo("Verified Profiles, Hire Requests")}</span>
                      </td>
                      <td className="py-space-md px-space-md text-on-surface-variant">{tYo("Certified Extension Apprenticeships")}</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">{tYo("Master Guild Rating Protocols")}</td>
                      <td className="py-space-md px-space-md text-right font-semibold text-primary">{tYo("Coming Later")}</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-space-md px-space-lg font-semibold text-primary flex items-center gap-2"><Icon name="storefront" className="text-secondary text-[18px]" />{tYo(" Input Suppliers")}</td>
                      <td className="py-space-md px-space-md">
                        <span className="inline-flex items-center gap-1 text-secondary font-medium"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />{tYo("Marketplace Listings")}</span>
                      </td>
                      <td className="py-space-md px-space-md text-on-surface-variant">{tYo("Consignment Inventory Financing")}</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">{tYo("Manufacturer Direct Depot Mesh")}</td>
                      <td className="py-space-md px-space-md text-right font-semibold text-primary">{tYo("Coming Later")}</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-space-md px-space-lg font-semibold text-primary flex items-center gap-2"><Icon name="factory" className="text-secondary text-[18px]" />{tYo(" Produce Offtakers")}</td>
                      <td className="py-space-md px-space-md">
                        <span className="inline-flex items-center gap-1 text-secondary font-medium"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />{tYo("Marketplace Checkout")}</span>
                      </td>
                      <td className="py-space-md px-space-md text-on-surface-variant">{tYo("Structured Forward Contracts")}</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">{tYo("Commodity Exchange Hedging API")}</td>
                      <td className="py-space-md px-space-md text-right font-semibold text-primary">{tYo("Coming Later")}</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-space-md px-space-lg font-semibold text-primary flex items-center gap-2"><Icon name="rv_hookup" className="text-secondary text-[18px]" />{tYo(" Logistics Operators")}</td>
                      <td className="py-space-md px-space-md">
                        <span className="inline-flex items-center gap-1 text-secondary font-medium"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />{tYo("Not Yet")}</span>
                      </td>
                      <td className="py-space-md px-space-md text-on-surface-variant">{tYo("Cold Chain Temperature Telemetry")}</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">{tYo("Multi-modal Rail Linkage Integration")}</td>
                      <td className="py-space-md px-space-md text-right font-semibold text-primary">{tYo("Coming Later")}</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-space-md px-space-lg font-semibold text-primary flex items-center gap-2"><Icon name="groups" className="text-secondary text-[18px]" />{tYo(" Cooperatives & Federations")}</td>
                      <td className="py-space-md px-space-md">
                        <span className="inline-flex items-center gap-1 text-secondary font-medium"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />{tYo("Not Yet")}</span>
                      </td>
                      <td className="py-space-md px-space-md text-on-surface-variant">{tYo("Multi-Sig Apex Treasury & Bulk Purchasing")}</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">{tYo("Cooperative Credit Union Rails")}</td>
                      <td className="py-space-md px-space-md text-right font-semibold text-primary">{tYo("Coming Later")}</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-space-md px-space-lg font-semibold text-primary flex items-center gap-2"><Icon name="account_balance" className="text-secondary text-[18px]" />{tYo(" Institutions & Lenders")}</td>
                      <td className="py-space-md px-space-md">
                        <span className="inline-flex items-center gap-1 text-secondary font-medium"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />{tYo("Not Yet")}</span>
                      </td>
                      <td className="py-space-md px-space-md text-on-surface-variant">{tYo("Underwriting Scoring Engine API")}</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">{tYo("Central Sovereign Agrarian Dashboard")}</td>
                      <td className="py-space-md px-space-md text-right font-semibold text-primary">{tYo("Institutional")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full max-w-7xl mx-auto px-margin-desktop py-space-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">
            <div className="lg:col-span-7 flex flex-col gap-space-md">
              <div className="inline-flex items-center gap-space-xs text-secondary font-label-sm text-label-sm font-bold uppercase tracking-wider"><Icon name="location_on" className="text-[18px]" />{tYo(" South-West Pilot")}</div>
              <h2 className="font-headline-lg text-headline-lg text-primary">{tYo("Built With Farmers in South-West Nigeria")}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">{tYo("You don't need to be tech-savvy to use CultivaNode. The pilot runs in Oyo, Ogun, Osun, Ondo, Ekiti and Lagos, and we are building it with farmers there. We will list partners here once agreements are signed.")}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md pt-space-xs">
                <div className="bg-surface-container-low p-space-md rounded-lg flex items-start gap-space-sm">
                  <Icon name="verified_user" className="text-primary text-[22px] mt-0.5" />
                  <div>
                    <span className="font-label-lg text-label-lg text-primary block">{tYo("Pay Providers Directly")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("When you hire in the pilot, you pay the tractor owner or farm hand directly. Escrow (money held until you confirm the job) is coming once a licensed payment partner is signed.")}</span>
                  </div>
                </div>
                <div className="bg-surface-container-low p-space-md rounded-lg flex items-start gap-space-sm">
                  <Icon name="translate" className="text-primary text-[22px] mt-0.5" />
                  <div>
                    <span className="font-label-lg text-label-lg text-primary block">{tYo("Three Languages")}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("The farm assistant works in English, Pidgin or Yorùbá.")}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 bg-surface-container-lowest p-space-lg rounded-lg shadow-sm flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <span className="font-label-lg text-label-lg text-primary font-bold">{tYo("Pilot States")}</span>
                <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-bold"><span className="w-2 h-2 rounded-full bg-secondary" />{tYo(" 6 Pilot States")}</span>
              </div>
              <div className="flex flex-col gap-space-xs font-body-sm text-body-sm">
                <div className="p-space-sm bg-surface-container-low rounded-lg flex justify-between items-center">
                  <div>
                    <span className="font-label-md text-label-md text-primary block">{tYo("Oyo State")}</span>
                    <span className="text-on-surface-variant text-[12px]">{tYo("Open for pilot sign-up")}</span>
                  </div>
                  <span className="font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded font-bold">{tYo("Pilot")}</span>
                </div>
                <div className="p-space-sm bg-surface-container-low rounded-lg flex justify-between items-center">
                  <div>
                    <span className="font-label-md text-label-md text-primary block">{tYo("Ogun State")}</span>
                    <span className="text-on-surface-variant text-[12px]">{tYo("Open for pilot sign-up")}</span>
                  </div>
                  <span className="font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded font-bold">{tYo("Pilot")}</span>
                </div>
                <div className="p-space-sm bg-surface-container-low rounded-lg flex justify-between items-center">
                  <div>
                    <span className="font-label-md text-label-md text-primary block">{tYo("Ondo & Ekiti States")}</span>
                    <span className="text-on-surface-variant text-[12px]">{tYo("Open for pilot sign-up")}</span>
                  </div>
                  <span className="font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded font-bold">{tYo("Pilot")}</span>
                </div>
                <div className="p-space-sm bg-surface-container-low rounded-lg flex justify-between items-center">
                  <div>
                    <span className="font-label-md text-label-md text-primary block">{tYo("Osun & Lagos States")}</span>
                    <span className="text-on-surface-variant text-[12px]">{tYo("Open for pilot sign-up")}</span>
                  </div>
                  <span className="font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded font-bold">{tYo("Pilot")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full bg-primary-container text-on-primary py-space-xl">
          <div className="max-w-7xl mx-auto px-margin-desktop">
            <div className="bg-primary/40 rounded-lg p-space-lg md:p-space-xl flex flex-col md:flex-row items-center justify-between gap-space-lg shadow-sm">
              <div className="flex flex-col gap-space-xs max-w-2xl text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 self-center md:self-start bg-secondary-fixed text-on-secondary-fixed px-space-sm py-0.5 rounded-full font-label-sm text-label-sm font-bold"><Icon name="support_agent" className="text-[16px]" />{tYo(" Questions?")}</div>
                <h2 className="font-headline-lg text-headline-lg text-on-primary font-bold">{tYo("Unsure Which Role Fits Your Operational Model?")}</h2>
                <p className="font-body-md text-body-md text-on-primary-container leading-relaxed">{tYo("Send us a message and we will help you pick the right role, or join the pilot waitlist.")}</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-space-sm w-full md:w-auto">
                <Link className="w-full sm:w-auto inline-flex items-center justify-center gap-space-xs bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim px-space-lg py-space-sm rounded-lg font-label-lg text-label-lg font-bold transition-colors shadow-sm" href={`/${lang}/contact`}>
                  <span>{tYo("Contact Us")}</span>
                  <Icon name="calendar_month" className="text-[18px]" />
                </Link>
                <Link className="w-full sm:w-auto inline-flex items-center justify-center gap-space-xs bg-surface-container-lowest text-primary hover:bg-surface-container px-space-lg py-space-sm rounded-lg font-label-lg text-label-lg font-semibold transition-colors shadow-sm" href={`/${lang}/waitlist`}>
                  <span>{tYo("Join the Waitlist")}</span>
                  <Icon name="near_me" className="text-[18px]" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
