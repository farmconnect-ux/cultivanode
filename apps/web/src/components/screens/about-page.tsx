"use client";

// Ported from the "about_cultivanode_mission_leadership" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";
import { phrasebook } from "@/i18n/marketing";
import YO from "@/i18n/yo-marketing/about-page";

const tYo = phrasebook(YO);

export function AboutPage({ lang = "en" }: ScreenProps) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <section className="relative w-full overflow-hidden bg-surface pt-space-xl pb-space-lg lg:pb-space-xl">
          <div className="max-w-7xl mx-auto px-margin-desktop relative z-10">
            <div className="inline-flex items-center gap-space-sm px-space-md py-1.5 rounded-full bg-surface-container-high mb-space-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary">{tYo("The CultivaNode Mission · Regional Agricultural Digital Rails")}</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-end mb-space-xl">
              <div className="lg:col-span-8 flex flex-col gap-space-sm">
                <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold tracking-tight max-w-4xl">{tYo("Architecting Verifiable Digital Infrastructure for African Agriculture")}</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl leading-relaxed">{tYo("Helping farmers in South-West Nigeria hire machinery and farm hands, plan their crops and keep their farm books. Built with farmers in the pilot.")}</p>
              </div>
              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-space-sm justify-end">
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <Icon name="verified" className="text-secondary text-[24px]" />
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{tYo("Pilot Status")}</p>
                      <p className="font-headline-sm text-headline-sm text-primary font-bold">{tYo("South-West Pilot")}</p>
                    </div>
                  </div>
                  <span className="font-label-sm text-label-sm px-space-sm py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-semibold">{tYo("Open")}</span>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <Icon name="gavel" className="text-primary text-[24px]" />
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{tYo("Data Protection")}</p>
                      <p className="font-headline-sm text-headline-sm text-primary font-bold">{tYo("We Follow NDPA 2023")}</p>
                    </div>
                  </div>
                  <Icon name="check_circle" className="text-secondary text-[20px]" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md pt-space-md">
              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{tYo("Who It Is For")}</span>
                  <Icon name="groups" className="text-secondary text-[20px]" />
                </div>
                <div>
                  <span className="font-metric-num text-metric-num text-primary font-bold block">{tYo("Farmers")}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Smallholders, machinery owners and farm hands")}</span>
                </div>
                <div className="mt-space-sm pt-space-xs text-secondary font-label-sm text-label-sm flex items-center gap-1"><Icon name="trending_up" className="text-[16px]" />{tYo(" Join the pilot")}</div>
              </div>
              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{tYo("Regional Expansion")}</span>
                  <Icon name="map" className="text-secondary text-[20px]" />
                </div>
                <div>
                  <span className="font-metric-num text-metric-num text-primary font-bold block">{tYo("6 States")}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Oyo, Ogun, Osun, Ondo, Ekiti, Lagos")}</span>
                </div>
                <div className="mt-space-sm pt-space-xs text-primary-container font-label-sm text-label-sm flex items-center gap-1"><Icon name="location_on" className="text-[16px]" />{tYo(" SW Agrarian Belt")}</div>
              </div>
              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{tYo("Agronomic Precision")}</span>
                  <Icon name="psychiatry" className="text-secondary text-[20px]" />
                </div>
                <div>
                  <span className="font-metric-num text-metric-num text-primary font-bold block">{tYo("15 Crops")}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("In the crop calendar")}</span>
                </div>
                <div className="mt-space-sm pt-space-xs text-secondary font-label-sm text-label-sm flex items-center gap-1"><Icon name="science" className="text-[16px]" />{tYo(" Planting to harvest")}</div>
              </div>
              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{tYo("Fleet Access")}</span>
                  <Icon name="toll" className="text-secondary text-[20px]" />
                </div>
                <div>
                  <span className="font-metric-num text-metric-num text-primary font-bold block">{tYo("₦0 Fee")}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("No platform fee on hires during the pilot")}</span>
                </div>
                <div className="mt-space-sm pt-space-xs text-secondary font-label-sm text-label-sm flex items-center gap-1"><Icon name="check_circle" className="text-[16px]" />{tYo(" You pay the provider directly")}</div>
              </div>
            </div>
          </div>
        </section>
        <section className="max-w-7xl mx-auto px-margin-desktop w-full my-space-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
            <div className="rounded-xl overflow-hidden shadow-sm h-64 bg-surface-container-low relative">
              <img className="w-full h-full object-cover" data-alt="An expansive aerial drone shot over green agricultural fields in Oyo North, Nigeria, showcasing neatly organized cassava and maize plots with precise geographic borders under soft early morning golden light." src="/images/screens/cda877cfe8af.webp" alt="" loading="lazy" decoding="async" />
              <div className="absolute bottom-0 inset-x-0 p-space-md bg-gradient-to-t from-primary/90 to-transparent">
                <p className="font-label-md text-label-md text-on-primary">{tYo("Pilot Area: Oyo North")}</p>
                <p className="font-body-sm text-body-sm text-surface-container-high">{tYo("Saki West & Iseyin farms")}</p>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden shadow-sm h-64 bg-surface-container-low relative">
              <img className="w-full h-full object-cover" data-alt="Close up of an agricultural officer and smallholder farmer in Ogun state inspecting healthy maize stalks with a rugged tablet displaying geographic polygons in daylight." src="/images/screens/5f4645bdd62e.webp" alt="" loading="lazy" decoding="async" />
              <div className="absolute bottom-0 inset-x-0 p-space-md bg-gradient-to-t from-primary/90 to-transparent">
                <p className="font-label-md text-label-md text-on-primary">{tYo("Proof of Work (Coming Soon)")}</p>
                <p className="font-body-sm text-body-sm text-surface-container-high">{tYo("Check-in and photos with location and time")}</p>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden shadow-sm h-64 bg-surface-container-low relative">
              <img className="w-full h-full object-cover" data-alt="A modern green tractor working on expansive red soil farmland in South-West Nigeria with mechanized tillage implements under bright equatorial sunlight." src="/images/screens/d738cb67290b.webp" alt="" loading="lazy" decoding="async" />
              <div className="absolute bottom-0 inset-x-0 p-space-md bg-gradient-to-t from-primary/90 to-transparent">
                <p className="font-label-md text-label-md text-on-primary">{tYo("Hire Tractors Near Your Farm")}</p>
                <p className="font-body-sm text-body-sm text-surface-container-high">{tYo("Verified machinery owners in the pilot")}</p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-space-xl bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-margin-desktop">
            <div className="max-w-3xl mb-space-xl">
              <div className="inline-flex items-center gap-space-xs px-space-sm py-1 rounded bg-surface-container font-label-sm text-label-sm text-tertiary mb-space-sm uppercase tracking-wider"><Icon name="warning" className="text-[16px] text-tertiary" />{tYo(" Structural Bottlenecks")}</div>
              <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold">{tYo("The Agricultural Dilemma We Resolve")}</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-space-xs">{tYo("Decades of agronomic stagnation across regional agrarian corridors stem from institutional coordination failure, not lack of farmer industriousness.")}</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-space-md">
                    <Icon name="agriculture" className="text-[28px]" />
                  </div>
                  <div className="flex items-center justify-between mb-space-xs">
                    <span className="font-label-sm text-label-sm text-error font-semibold uppercase tracking-wider">{tYo("Barrier 01")}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Fleet Inefficiency")}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary font-semibold mb-space-sm">{tYo("The Mechanization Trap & Deadhead Crisis")}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-space-md leading-relaxed">{tYo("Smallholders often pay middlemen extra for tractor hire, and tractors do not always come when the rains start. Machinery owners lose money driving long distances between small farms.")}</p>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between font-label-sm text-label-sm">
                    <span className="text-on-surface-variant">{tYo("Tractors for smallholders")}</span>
                    <span className="font-bold text-error">{tYo("Too few")}</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-error h-full rounded-full" style={{ width: "22%" }} />
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("CultivaNode helps you find verified machinery owners near your farm.")}</span>
                </div>
              </div>
              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-space-md">
                    <Icon name="description" className="text-[28px]" />
                  </div>
                  <div className="flex items-center justify-between mb-space-xs">
                    <span className="font-label-sm text-label-sm text-error font-semibold uppercase tracking-wider">{tYo("Barrier 02")}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Credit Ineligibility")}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary font-semibold mb-space-sm">{tYo("The Paperwork & Land Tenure Void")}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-space-md leading-relaxed">{tYo("Many farmers hold land under customary title with no survey plan, and keep no written farm records. Without records, getting a farm loan is hard.")}</p>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between font-label-sm text-label-sm">
                    <span className="text-on-surface-variant">{tYo("Access to farm loans")}</span>
                    <span className="font-bold text-error">{tYo("Limited")}</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-error h-full rounded-full" style={{ width: "91%" }} />
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Farm books and farm locations in CultivaNode give you a record of your work.")}</span>
                </div>
              </div>
              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-space-md">
                    <Icon name="science" className="text-[28px]" />
                  </div>
                  <div className="flex items-center justify-between mb-space-xs">
                    <span className="font-label-sm text-label-sm text-error font-semibold uppercase tracking-wider">{tYo("Barrier 03")}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Market Exploitation")}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary font-semibold mb-space-sm">{tYo("Adulterated Inputs & Farmgate Cartels")}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-space-md leading-relaxed">{tYo("Fake or diluted seeds and agrochemicals are a common problem, and farmgate prices often drop at harvest when everyone sells at once.")}</p>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between font-label-sm text-label-sm">
                    <span className="text-on-surface-variant">{tYo("Fake and diluted inputs")}</span>
                    <span className="font-bold text-error">{tYo("A common problem")}</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-error h-full rounded-full" style={{ width: "35%" }} />
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Store and inventory records now; a fertiliser and spray planner is coming soon.")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-space-xl bg-surface">
          <div className="max-w-7xl mx-auto px-margin-desktop">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-space-xl gap-space-md">
              <div>
                <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider">{tYo("Engineering Foundations")}</span>
                <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold mt-1">{tYo("Our Core Product Philosophy & Tenets")}</h2>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md">{tYo("Built for the reality of farming in rural South-West Nigeria.")}</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
              <div className="lg:col-span-6 p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-space-sm mb-space-sm">
                    <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                      <Icon name="verified_user" className="text-[22px]" />
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold">{tYo("Tenet 01")}</span>
                      <h3 className="font-headline-md text-headline-md text-primary font-bold">{tYo("Trust Through Checks and Proof")}</h3>
                    </div>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-space-md">{tYo("Everyone who lists equipment or receives payments is checked with their NIN, BVN and bank account. Proof of work (check-in and photos with location and time) is coming soon.")}</p>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <Icon name="layers" className="text-secondary text-[20px]" />
                    <span className="font-label-sm text-label-sm text-on-surface font-semibold">{tYo("Proof of work: check-in + photos")}</span>
                  </div>
                  <span className="font-label-sm text-label-sm px-space-sm py-0.5 rounded bg-surface-container-highest text-primary">{tYo("Coming Soon")}</span>
                </div>
              </div>
              <div className="lg:col-span-6 p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-space-sm mb-space-sm">
                    <div className="w-10 h-10 rounded-lg bg-secondary text-on-secondary flex items-center justify-center">
                      <Icon name="policy" className="text-[22px]" />
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold">{tYo("Tenet 02")}</span>
                      <h3 className="font-headline-md text-headline-md text-primary font-bold">{tYo("Your Data, Your Consent")}</h3>
                    </div>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-space-md">{tYo("We follow the Nigeria Data Protection Act 2023: we ask for consent before ID checks, store only masked ID numbers, and you can ask to download or delete your data.")}</p>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <Icon name="lock" className="text-secondary text-[20px]" />
                    <span className="font-label-sm text-label-sm text-on-surface font-semibold">{tYo("Consent before ID checks")}</span>
                  </div>
                  <span className="font-label-sm text-label-sm px-space-sm py-0.5 rounded bg-surface-container-highest text-primary">{tYo("Download or delete")}</span>
                </div>
              </div>
              <div className="lg:col-span-6 p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-space-sm mb-space-sm">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                      <Icon name="wifi_off" className="text-[22px]" />
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold">{tYo("Tenet 03")}</span>
                      <h3 className="font-headline-md text-headline-md text-primary font-bold">{tYo("Built for Rural Networks")}</h3>
                    </div>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-space-md">{tYo("Records are kept in a Postgres database (Supabase) with PostGIS for farm locations and row-level security. Offline mode, for farms with weak network, is coming soon.")}</p>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Offline mode")}</span>
                  <span className="font-label-sm text-label-sm text-secondary font-bold">{tYo("Coming Soon")}</span>
                </div>
              </div>
              <div className="lg:col-span-6 p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-space-sm mb-space-sm">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                      <Icon name="account_balance" className="text-[22px]" />
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold">{tYo("Tenet 04")}</span>
                      <h3 className="font-headline-md text-headline-md text-primary font-bold">{tYo("Honest Payments")}</h3>
                    </div>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-space-md">{tYo("When you hire in the pilot, you pay the tractor owner or farm hand directly. Escrow (money held until you confirm the job) is coming once a licensed payment partner is signed.")}</p>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Escrow partner")}</span>
                  <span className="font-label-sm text-label-sm text-secondary font-bold">{tYo("Not signed yet")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-space-xl bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-margin-desktop">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-xl items-end">
              <div className="lg:col-span-8">
                <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider">{tYo("Pilot Geography")}</span>
                <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold mt-1">{tYo("Regional Focus: The South-West Pilot")}</h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant mt-space-xs">{tYo("South-West Nigeria has two main farming belts with different rains and crops. CultivaNode is built with farmers in both.")}</p>
              </div>
              <div className="lg:col-span-4 flex items-center lg:justify-end gap-space-sm">
                <div className="p-space-sm px-space-md rounded-lg bg-surface-container-lowest shadow-sm flex items-center gap-space-xs">
                  <Icon name="hub" className="text-secondary text-[20px]" />
                  <span className="font-label-sm text-label-sm font-semibold text-primary">{tYo("6 Pilot States")}</span>
                </div>
                <div className="p-space-sm px-space-md rounded-lg bg-surface-container-lowest shadow-sm flex items-center gap-space-xs">
                  <Icon name="layers" className="text-primary text-[20px]" />
                  <span className="font-label-sm text-label-sm font-semibold text-primary">{tYo("2 Agro-Ecological Belts")}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
              <div className="lg:col-span-7 rounded-xl overflow-hidden shadow-sm bg-surface-container-lowest flex flex-col">
                <div className="p-space-md bg-surface-container flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="public" className="text-secondary text-[20px]" />
                    <span className="font-label-md text-label-md text-primary font-bold">{tYo("South-West Nigeria Pilot Area (Oyo, Ogun, Osun, Ondo, Ekiti, Lagos)")}</span>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Illustrative map")}</span>
                </div>
                <div className="w-full h-80 bg-cover bg-center" data-location="Ibadan, Oyo State, Nigeria" style={{ backgroundImage: "url('/images/screens/9107876e6c7f.webp')" }} />
                <div className="p-space-md flex flex-wrap items-center justify-between gap-space-sm bg-surface-container-lowest">
                  <div className="flex items-center gap-space-md font-label-sm text-label-sm">
                    <span className="flex items-center gap-1.5 text-primary font-semibold"><span className="w-2.5 h-2.5 rounded-full bg-primary" />{tYo(" Savanna Belt")}</span>
                    <span className="flex items-center gap-1.5 text-secondary font-semibold"><span className="w-2.5 h-2.5 rounded-full bg-secondary" />{tYo(" Forest Belt")}</span>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Built with farmers in both belts")}</span>
                </div>
              </div>
              <div className="lg:col-span-5 flex flex-col gap-space-md justify-between">
                <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <span className="px-space-sm py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-primary font-semibold">{tYo("Agro-Zone 01")}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Bimodal Onset: April–May")}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary font-bold">{tYo("Derived Savanna Belt")}</h3>
                  <p className="font-label-sm text-label-sm text-secondary font-semibold">{tYo("Oyo North (Saki, Iseyin, Kisi) & Northern Ogun")}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Expansive, open plains suited for heavy mechanized tractor syndicates. Core production corridor for White Maize (SAMMAZ-15), Industrial Starch Cassava (TME-419), Soya, and Large Yam mounds.")}</p>
                  <div className="flex flex-wrap gap-1.5 pt-space-xs">
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-low text-primary">{tYo("SAMMAZ-15")}</span>
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-low text-primary">{tYo("TME-419 Cassava")}</span>
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-low text-primary">{tYo("Yam Ridging")}</span>
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-low text-primary">{tYo("Soya Bean")}</span>
                  </div>
                </div>
                <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <span className="px-space-sm py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-secondary font-semibold">{tYo("Agro-Zone 02")}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Heavy Rain: 1,800mm+")}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary font-bold">{tYo("Rainforest & Coastal Forest Belt")}</h3>
                  <p className="font-label-sm text-label-sm text-secondary font-semibold">{tYo("Ogun (Ijebu/Sagamu), Osun, Ondo (Akure/Owo), Ekiti, Lagos")}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("High moisture and rich loam soils. Suited to tree crops (cocoa, oil palm), plantain, vegetables and agro-forestry.")}</p>
                  <div className="flex flex-wrap gap-1.5 pt-space-xs">
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-low text-primary">{tYo("Fine Cocoa")}</span>
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-low text-primary">{tYo("Oil Palm")}</span>
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-low text-primary">{tYo("Plantain Roster")}</span>
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-low text-primary">{tYo("Peri-Urban Veg")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-space-xl bg-surface">
          <div className="max-w-7xl mx-auto px-margin-desktop">
            <div className="max-w-3xl mb-space-xl">
              <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider">{tYo("Field & Systems Governance")}</span>
              <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold mt-1">{tYo("The Team")}</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-space-xs">{tYo("CultivaNode is run by Excel Palace Global Concept (BN 7455859), a business name registered with the Corporate Affairs Commission.")}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 rounded-xl overflow-hidden mb-space-md bg-surface-container">
                    <img className="w-full h-full object-cover" data-alt="Portrait for Quadri Olapade, founder of CultivaNode." src="/images/screens/48822b2e1bac.webp" alt="" loading="lazy" decoding="async" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary font-bold">{tYo("Quadri Olapade")}</h3>
                  <p className="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider mb-space-sm">{tYo("Founder")}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Founder of CultivaNode, building it with farmers in the South-West pilot.")}</p>
                </div>
                <div className="mt-space-md pt-space-sm text-on-surface-variant font-label-sm text-label-sm flex items-center gap-1"><Icon name="code" className="text-[16px] text-secondary" />{tYo(" Building CultivaNode")}</div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-space-xl bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-margin-desktop">
            <div className="text-center max-w-2xl mx-auto mb-space-lg">
              <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider">{tYo("Partners")}</span>
              <h2 className="font-headline-lg text-headline-lg text-primary font-bold mt-1">{tYo("Our Partners")}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">{tYo("We only name an organisation here after a written agreement.")}</p>
            </div>
            <div className="grid grid-cols-1 gap-space-md items-center">
              <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col items-center text-center gap-space-xs">
                <Icon name="handshake" className="text-primary text-[32px]" />
                <span className="font-label-md text-label-md text-primary font-bold">{tYo("No partners listed yet")}</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("We will list partners here once agreements are signed.")}</span>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-space-xl bg-surface">
          <div className="max-w-7xl mx-auto px-margin-desktop">
            <div className="p-space-xl rounded-xl bg-primary-container text-on-primary shadow-md relative overflow-hidden">
              <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-secondary opacity-20 filter blur-3xl pointer-events-none" />
              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-space-xs px-space-sm py-1 rounded bg-primary font-label-sm text-label-sm text-on-primary mb-space-md"><span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed" />{tYo(" Pilot Sign-ups Open")}</div>
                <h2 className="font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg font-bold text-on-primary leading-tight mb-space-sm">{tYo("Join the Pilot or Partner With Us")}</h2>
                <p className="font-body-lg text-body-lg text-surface-container-high leading-relaxed mb-space-xl">{tYo("Whether you farm in Kisi, own tractors in Sagamu, or work in agricultural extension, you can join the pilot or talk to us about working together.")}</p>
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-space-md">
                  <Link className="inline-flex items-center justify-center font-label-lg text-label-lg font-bold px-space-lg py-space-sm rounded-lg bg-surface-container-lowest text-primary hover:bg-surface-container transition-colors shadow-sm" href={`/${lang}/sign-up`}><Icon name="how_to_reg" className="mr-space-xs text-[20px]" />{tYo(" Apply to Join Pilot (Farmers & Fleets)")}</Link>
                  <Link className="inline-flex items-center justify-center font-label-lg text-label-lg font-bold px-space-lg py-space-sm rounded-lg bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container transition-colors shadow-sm" href={`/${lang}/contact`}><Icon name="handshake" className="mr-space-xs text-[20px]" />{tYo(" Institutional & State Partnerships")}</Link>
                  <Link className="inline-flex items-center justify-center font-label-lg text-label-lg font-semibold px-space-md py-space-sm rounded-lg text-on-primary hover:bg-primary transition-colors" href={`/${lang}/whitepaper`}><Icon name="menu_book" className="mr-space-xs text-[20px]" />{tYo(" Technical Whitepaper")}</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
