"use client";

// Ported from the "machinery_services_directory_cultivanode" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { useState, useId } from "react";
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogClose, showScreenToast } from "@/components/ds/screen-dialog";
import { downloadFile } from "@/lib/download";
import type { ScreenProps } from "./types";
import { phrasebook } from "@/i18n/marketing";
import YO from "@/i18n/yo-marketing/machinery-directory";

const tYo = phrasebook(YO);

interface MachineryItem {
  id: string;
  name: string;
  syndicate: string;
  category: string;
  cluster: string;
  location: string;
  image: string;
  alt: string;
  availability: string;
  availabilityColor: string;
  rating: number;
  jobsCount: number;
  operator: string;
  credentials: string;
  features: string;
  rate: number;
  rateUnit: string;
  rateLabel: string;
}

const FLEET_DATA: MachineryItem[] = [
  {
    id: "MF-375-01",
    name: "Massey Ferguson 375 4WD (75 HP) + Baldan 3-Disc Plow",
    syndicate: "Saki West Tractor Syndicate #04",
    category: "tillage",
    cluster: "oyo-saki",
    location: "Saki, Oyo State · 35km radius",
    image: "/images/screens/3da3cb4ce8df.webp",
    alt: "Red Massey Ferguson 375 4WD farm tractor parked near an open arable field in Saki Oyo State",
    availability: "Available Tomorrow",
    availabilityColor: "bg-secondary-fixed text-on-secondary-fixed",
    rating: 4.9,
    jobsCount: 38,
    operator: "Jimoh Rasaq",
    credentials: "NIN Tier 2 · 340+ hrs logged",
    features: "GPS PoW · Fuel: Owner Provided",
    rate: 18500,
    rateUnit: "/ Ha",
    rateLabel: "Hectare Charge",
  },
  {
    id: "JD-5075E-02",
    name: "John Deere 5075E + 24-Row Precision Planter & Applicator",
    syndicate: "Abeokuta Agrotech Coop",
    category: "tillage",
    cluster: "ogun-abeokuta",
    location: "Abeokuta North, Ogun State",
    image: "/images/screens/d89e4436a812.webp",
    alt: "Green and yellow John Deere 5075E utility tractor attached to modern 24-row precision planting rig",
    availability: "In 2 Days",
    availabilityColor: "bg-surface-container-highest text-on-surface",
    rating: 4.8,
    jobsCount: 24,
    operator: "Segun Oladipo",
    credentials: "Certified Mechanization Lead",
    features: "Sub-meter RTK Guidance · Operator Inc.",
    rate: 22000,
    rateUnit: "/ Ha",
    rateLabel: "Hectare Charge",
  },
  {
    id: "DJI-T40-03",
    name: "DJI Agras T40 Agricultural Drone Fleet (Atomized Spray)",
    syndicate: "GreenPulse Precision Services",
    category: "drone",
    cluster: "oyo-ibadan",
    location: "Ibadan Central, Oyo (All SW States Coverage)",
    image: "/images/screens/241d95c6e3e4.webp",
    alt: "High tech commercial DJI Agras T40 agricultural multicopter drone poised on landing platform",
    availability: "Available Today",
    availabilityColor: "bg-secondary-fixed text-on-secondary-fixed",
    rating: 5.0,
    jobsCount: 52,
    operator: "Engr. F. Adeleke",
    credentials: "CAA Licensed Drone Operator",
    features: "40L Payload · NDVI Contour Flight",
    rate: 8000,
    rateUnit: "/ Ha (Chems excl.)",
    rateLabel: "Precision Rate",
  },
  {
    id: "NH-TC530-04",
    name: "New Holland TC5.30 Combine (Rice & Maize Headers)",
    syndicate: "Oke-Ogun Grain Cluster Fleet",
    category: "harvesting",
    cluster: "oyo-saki",
    location: "Iseyin LGA, Oyo State",
    image: "/images/screens/197b7e7689de.webp",
    alt: "Heavy yellow New Holland combine harvester operating across open cereal fields in Iseyin",
    availability: "Next Week (Early Maize)",
    availabilityColor: "bg-surface-container-highest text-on-surface",
    rating: 4.7,
    jobsCount: 19,
    operator: "Tunde Balogun",
    credentials: "<1.8% Grain Loss Guarantee",
    features: "5-Row Maize Header & Cutterbar",
    rate: 28000,
    rateUnit: "/ Ha",
    rateLabel: "Harvest Rate",
  },
  {
    id: "CAT-D6R-05",
    name: "Heavy Bulldozer CAT D6R (Land Stumping & Ripping)",
    syndicate: "Western Infrastructure & Agro Syndicate",
    category: "clearing",
    cluster: "ondo-akure",
    location: "Akure, Ondo State",
    image: "/images/screens/cbc74d8061bf.webp",
    alt: "Sturdy yellow Caterpillar CAT D6R crawler bulldozer clearing thick vegetative bushland",
    availability: "In 3 Days",
    availabilityColor: "bg-surface-container-highest text-on-surface",
    rating: 4.9,
    jobsCount: 15,
    operator: "Sunday Ogundipe",
    credentials: "Virgin Forest Bush Stumping",
    features: "Low-Bed Dispatch via Escrow",
    rate: 55000,
    rateUnit: "/ Ha",
    rateLabel: "Stumping Rate",
  },
  {
    id: "SPRAY-GANG-06",
    name: "Certified Mobile Spray Gang & Scouting (5 Persons)",
    syndicate: "Oyo ADP Accredited Pruning & Spray Gang",
    category: "spraying",
    cluster: "oyo-saki",
    location: "Ogbomoso South, Oyo State",
    image: "/images/screens/18d7fa5591fb.webp",
    alt: "Coordinated team of certified agricultural farm workers wearing uniform protective gear",
    availability: "Available Daily",
    availabilityColor: "bg-secondary-fixed text-on-secondary-fixed",
    rating: 4.8,
    jobsCount: 41,
    operator: "Kazeem Alao",
    credentials: "Safe Chemical Handling (ADP Cert)",
    features: "Up to 12 Hectares / Day",
    rate: 6000,
    rateUnit: "/ Ha",
    rateLabel: "Labor Rate",
  },
];

export function MachineryDirectory({ lang = "en" }: ScreenProps) {
  const serviceSelectId = useId();
  const clusterSelectId = useId();
  const dateInputId = useId();

  // Search and Filter State
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCluster, setSelectedCluster] = useState("all");
  const [selectedDate, setSelectedDate] = useState("2025-04-10");
  const [sortBy, setSortBy] = useState<"fastest" | "price" | "rating">("fastest");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal Dialogs
  const [bookingItem, setBookingItem] = useState<MachineryItem | null>(null);
  const [bookingHectares, setBookingHectares] = useState<number>(5);
  const [bookingBank, setBookingBank] = useState<string>("Zenith Bank");
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  // Provider Form State
  const [providerForm, setProviderForm] = useState({
    syndicateName: "",
    equipmentType: "Tractor (75+ HP)",
    cluster: "Oyo — Saki West",
    vinChassis: "",
    operatorName: "",
    dailyRate: "20000",
    phone: "",
  });

  // Filtered Items
  const filteredList = FLEET_DATA.filter((item) => {
    if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
    if (selectedCluster !== "all" && item.cluster !== selectedCluster) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "price") return a.rate - b.rate;
    if (sortBy === "rating") return b.rating - a.rating;
    return 0; // default fastest
  });

  const handleResetFilters = () => {
    setSelectedCategory("all");
    setSelectedCluster("all");
    setSelectedDate("2025-04-10");
    setSortBy("fastest");
    setCurrentPage(1);
    showScreenToast(tYo.now("Filters reset to default 342 South-West fleet units."));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    showScreenToast(`Discovered ${filteredList.length} verified machines matching your cluster and timeline criteria.`);
  };

  const handleConfirmBooking = () => {
    if (!bookingItem) return;
    const totalAmount = bookingItem.rate * bookingHectares;
    const escrowRef = "ESC-BKG-" + Math.floor(100000 + Math.random() * 900000);
    showScreenToast(`Booking locked! ₦${totalAmount.toLocaleString()} deposited in ${bookingBank} escrow trust. Ref: ${escrowRef}`);
    setBookingItem(null);
  };

  const handleRegisterProvider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerForm.syndicateName || !providerForm.phone) {
      showScreenToast(tYo.now("Please provide syndicate name and direct phone number."));
      return;
    }
    const appRef = "SYND-REG-" + Math.floor(1000 + Math.random() * 9000);
    showScreenToast(`Equipment provider registration submitted! Vetting team assigned. Ref: ${appRef}`);
    setShowProviderModal(false);
    setProviderForm({
      syndicateName: "",
      equipmentType: "Tractor (75+ HP)",
      cluster: "Oyo — Saki West",
      vinChassis: "",
      operatorName: "",
      dailyRate: "20000",
      phone: "",
    });
  };

  const handleDownloadHandbook = () => {
    const handbookContent = `# CultivaNode Mechanization & Operator Handbook (2026/2027)
Statutory Mechanization Operations, Escrow Custody, and Telematics Proof-of-Work Standards
Accredited by South-West Nigeria Agricultural Development Programmes (SW-ADPs)

## 1. Scope & Objective
This handbook outlines operational governance, equipment dispatch protocols, and dispute adjudication procedures for tractor syndicates, combine harvester operators, and aerial spray contractors registered on the CultivaNode Mesh Portal.

## 2. Geofenced Proof-of-Work (PoW) Protocol
- Every tractor or implement deployed must transmit continuous CAN-bus telemetry and RTK sub-meter GNSS coordinates.
- Payout triggers require a minimum 98.0% cadastral polygon traversal coverage corroborating agreed farm boundaries.
- Unworked perimeters (e.g., granitic outcrops or riverine marshes) are adjudicated under ToS §5.4 (Geological Impassability).

## 3. CBN Escrow Trust & Settlement Schedule
- Farmer rental funds are locked in designated custodian vaults (Zenith Bank / Providus Bank) at 0% platform commission during the SW Pilot.
- Disbursements are executed within 48 hours of farmer digital PIN confirmation or automated telemetry clearance.
- In disputed work completions, independent ADP arbiters assess drone and satellite imagery within 24 hours.

## 4. Safety & Environmental Safeguards
- Boom spraying operations require calibrated low-drift nozzles and compliance with 48h pre-harvest intervals (PHI).
- Mandatory PPE compliance verified by biometric operator authentication.

CultivaNode Operations Bureau · Secretariat: Ibadan, Oyo State, Nigeria`;

    downloadFile("cultivanode-mechanization-operator-handbook.md", handbookContent, "text/markdown");
    showScreenToast(tYo.now("Mechanization Operator Handbook downloaded successfully."));
  };

  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <section className="w-full bg-surface-container-low py-space-md">
          <div className="max-w-7xl mx-auto px-margin-desktop flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface-variant flex-wrap">
              <Link className="hover:text-primary transition-colors flex items-center gap-1" href={`/${lang}`}>
                <Icon name="home" className="text-[16px]" />
                <span>{tYo("Mesh Portal")}</span>
              </Link>
              <span className="text-outline-variant">/</span>
              <span className="text-on-surface-variant">{tYo("Regional Operations")}</span>
              <span className="text-outline-variant">/</span>
              <span className="text-primary font-semibold">{tYo("Machinery & Services Hub")}</span>
            </div>
            <div className="inline-flex items-center gap-space-xs self-start md:self-auto bg-surface-container-lowest px-space-md py-1 rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">{tYo("South-West Pilot Mechanization Mesh · 0% Platform Commission")}</span>
            </div>
          </div>
        </section>

        <section className="w-full bg-surface-container-lowest shadow-sm py-space-xl">
          <div className="max-w-7xl mx-auto px-margin-desktop flex flex-col gap-space-lg">
            <div className="flex flex-col gap-space-xs max-w-4xl">
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight">{tYo("Find Verified Farm Machinery & Skilled Agricultural Services")}</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">{tYo("Discover, book, and deploy vetted tractor syndicates, combine harvesters, boom sprayers, and certified field operators across Oyo, Ogun, Osun, Ondo, Ekiti, and Lagos. Backed by GPS-geofenced Proof-of-Work and CBN escrow custody.")}</p>
            </div>

            <div className="w-full bg-surface-container-low p-space-md rounded-xl shadow-sm">
              <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-space-md items-end" role="search">
                <div className="lg:col-span-4 flex flex-col gap-space-xs">
                  <label htmlFor={serviceSelectId} className="font-label-sm text-label-sm text-on-surface-variant uppercase flex items-center gap-1">
                    <Icon name="agriculture" className="text-[14px] text-secondary" />{tYo(" Service Category")}</label>
                  <div className="relative bg-surface-container-lowest rounded-lg">
                    <select
                      id={serviceSelectId}
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full h-10 px-space-md font-body-sm text-body-sm text-on-surface bg-transparent appearance-none rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="all">{tYo("All Vetted Agrarian Operations")}</option>
                      <option value="tillage">{tYo("Tractor Tillage & Disc Ridging")}</option>
                      <option value="clearing">{tYo("Heavy Land Clearing & Stumping")}</option>
                      <option value="spraying">{tYo("Calibrated Tractor Boom Spraying")}</option>
                      <option value="drone">{tYo("Drone Precision Spraying (DJI Agras)")}</option>
                      <option value="harvesting">{tYo("Combine Harvesting (Rice, Maize, Soy)")}</option>
                      <option value="scouting">{tYo("Soil pH & Precision Agronomy Scouting")}</option>
                    </select>
                    <Icon name="expand_more" className="absolute right-3 top-2.5 text-on-surface-variant pointer-events-none text-[18px]" />
                  </div>
                </div>

                <div className="lg:col-span-3 flex flex-col gap-space-xs">
                  <label htmlFor={clusterSelectId} className="font-label-sm text-label-sm text-on-surface-variant uppercase flex items-center gap-1">
                    <Icon name="distance" className="text-[14px] text-secondary" />{tYo(" Agrarian Cluster / LGA")}</label>
                  <div className="relative bg-surface-container-lowest rounded-lg">
                    <select
                      id={clusterSelectId}
                      value={selectedCluster}
                      onChange={(e) => setSelectedCluster(e.target.value)}
                      className="w-full h-10 px-space-md font-body-sm text-body-sm text-on-surface bg-transparent appearance-none rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="all">{tYo("All SW Hubs (6 States)")}</option>
                      <option value="oyo-saki">{tYo("Oyo — Saki West / Iseyin Belt")}</option>
                      <option value="oyo-ibadan">{tYo("Oyo — Ibadan Central / Ido")}</option>
                      <option value="ogun-abeokuta">{tYo("Ogun — Abeokuta North / Obafemi")}</option>
                      <option value="ondo-akure">{tYo("Ondo — Akure / Owo Grain Hub")}</option>
                    </select>
                    <Icon name="expand_more" className="absolute right-3 top-2.5 text-on-surface-variant pointer-events-none text-[18px]" />
                  </div>
                </div>

                <div className="lg:col-span-3 flex flex-col gap-space-xs">
                  <label htmlFor={dateInputId} className="font-label-sm text-label-sm text-on-surface-variant uppercase flex items-center gap-1">
                    <Icon name="calendar_today" className="text-[14px] text-secondary" />{tYo(" Mobilization Window")}</label>
                  <div className="relative bg-surface-container-lowest rounded-lg">
                    <input
                      id={dateInputId}
                      className="w-full h-10 px-space-md font-body-sm text-body-sm text-on-surface bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <button className="w-full h-10 inline-flex items-center justify-center gap-space-xs font-label-lg text-label-lg font-semibold bg-primary-container text-on-primary hover:bg-primary transition-all duration-150 rounded-lg shadow-sm cursor-pointer" type="submit">
                    <Icon name="search" className="text-[18px]" />
                    <span>{tYo("Find Fleet")}</span>
                  </button>
                </div>
              </form>

              <div className="flex flex-wrap items-center gap-space-sm pt-space-md text-on-surface-variant font-label-sm text-label-sm">
                <span className="font-semibold text-on-surface">{tYo("Live Filters:")}</span>
                <span className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed">
                  <Icon name="check" className="text-[14px]" />{tYo(" In-radius <35km")}</span>
                <span className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full bg-surface-container text-on-surface">{tYo("Operator Included")}</span>
                <span className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full bg-surface-container text-on-surface">{tYo("GPS Telematics Active")}</span>
                <span className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full bg-surface-container text-on-surface">{tYo("Fuel-included quotes")}</span>
                <button onClick={handleResetFilters} className="ml-auto text-secondary hover:underline font-semibold flex items-center gap-1 cursor-pointer" type="button">
                  <Icon name="restart_alt" className="text-[14px]" />{tYo(" Reset Filters")}</button>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full bg-surface py-space-lg">
          <div className="max-w-7xl mx-auto px-margin-desktop">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-md">
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase">{tYo("Fleet Ready")}</span>
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="minor_crash" className="text-[18px]" />
                  </div>
                </div>
                <div>
                  <div className="font-metric-num text-metric-num text-primary">342</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Active Tractors & Implements")}</div>
                </div>
                <div className="mt-space-sm flex items-center gap-1 font-label-sm text-label-sm text-secondary">
                  <Icon name="trending_up" className="text-[14px]" />
                  <span>{tYo("+28 joined this week")}</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase">{tYo("Deployment SLA")}</span>
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                    <Icon name="speed" className="text-[18px]" />
                  </div>
                </div>
                <div>
                  <div className="font-metric-num text-metric-num text-primary">&lt;48h</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Guaranteed Dispatch Window")}</div>
                </div>
                <div className="mt-space-sm flex items-center gap-1 font-label-sm text-label-sm text-secondary">
                  <Icon name="check_circle" className="text-[14px]" />
                  <span>{tYo("Oyo & Ogun Primary Corridors")}</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase">{tYo("Pilot Commission")}</span>
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-tertiary">
                    <Icon name="percent" className="text-[18px]" />
                  </div>
                </div>
                <div>
                  <div className="font-metric-num text-metric-num text-primary">{tYo("₦0 Fee")}</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Platform Booking Commission")}</div>
                </div>
                <div className="mt-space-sm flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
                  <Icon name="verified" className="text-[14px] text-secondary" />
                  <span>{tYo("Supported by SW ADP Subsidies")}</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase">{tYo("Escrow Protocol")}</span>
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="security" className="text-[18px]" />
                  </div>
                </div>
                <div>
                  <div className="font-metric-num text-metric-num text-primary">100%</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Geofenced PoW Validation")}</div>
                </div>
                <div className="mt-space-sm flex items-center gap-1 font-label-sm text-label-sm text-secondary">
                  <Icon name="lock" className="text-[14px]" />
                  <span>{tYo("CBN-Regulated Escrow Vault")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-space-xl">
          <div className="max-w-7xl mx-auto px-margin-desktop flex flex-col gap-space-lg">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
              <div>
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">{tYo("Specialized Agricultural Capabilities")}</span>
                <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">{tYo("Mechanization & Agronomic Service Categories")}</h2>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">{tYo("Standardized unit rates across South-West Nigeria clusters. Transparent hectare pricing with zero hidden contractor mobilization costs.")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
              <div
                onClick={() => {
                  setSelectedCategory("tillage");
                  showScreenToast(tYo.now("Filtering by Tractor Tillage & Plowing..."));
                }}
                className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between group cursor-pointer"
              >
                <div className="flex flex-col gap-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
                    <Icon name="agriculture" className="text-[28px]" />
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">{tYo("Tractor Tillage & Plowing")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Disc plows, heavy harrows, and cassava ridgers operated by vetted tractor operators. Calibrated depth control for optimal root aeration.")}</p>
                </div>
                <div className="mt-space-lg pt-space-sm bg-surface-container-low px-space-md py-space-sm rounded-lg flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Benchmark Rate:")}</span>
                  <span className="font-label-lg text-label-lg font-bold text-primary">{tYo("From ₦18,500 / Ha")}</span>
                </div>
              </div>

              <div
                onClick={() => {
                  setSelectedCategory("clearing");
                  showScreenToast(tYo.now("Filtering by Land Preparation & Stumping..."));
                }}
                className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between group cursor-pointer"
              >
                <div className="flex flex-col gap-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
                    <Icon name="construction" className="text-[28px]" />
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">{tYo("Land Preparation & Stumping")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Bulldozers (CAT D6/D7), hydraulic excavators, and root rippers engineered for virgin agrarian bush opening and secondary forest grading.")}</p>
                </div>
                <div className="mt-space-lg pt-space-sm bg-surface-container-low px-space-md py-space-sm rounded-lg flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Benchmark Rate:")}</span>
                  <span className="font-label-lg text-label-lg font-bold text-primary">{tYo("From ₦45,000 / Ha")}</span>
                </div>
              </div>

              <div
                onClick={() => {
                  setSelectedCategory("spraying");
                  showScreenToast(tYo.now("Filtering by Crop Protection & Spraying..."));
                }}
                className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between group cursor-pointer"
              >
                <div className="flex flex-col gap-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
                    <Icon name="shower" className="text-[28px]" />
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">{tYo("Crop Protection & Spraying")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Calibrated 600L-800L tractor boom sprayers alongside DJI Agras T30/T40 drones for rapid, drift-minimized herbicide and insecticide passes.")}</p>
                </div>
                <div className="mt-space-lg pt-space-sm bg-surface-container-low px-space-md py-space-sm rounded-lg flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Benchmark Rate:")}</span>
                  <span className="font-label-lg text-label-lg font-bold text-primary">{tYo("From ₦6,500 / Ha")}</span>
                </div>
              </div>

              <div
                onClick={() => {
                  setSelectedCategory("harvesting");
                  showScreenToast(tYo.now("Filtering by Grain & Tuber Harvesting..."));
                }}
                className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between group cursor-pointer"
              >
                <div className="flex flex-col gap-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
                    <Icon name="grain" className="text-[28px]" />
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">{tYo("Grain & Tuber Harvesting")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Mechanical cassava uprooters and multi-crop combines with specialized rice track undercarriages and maize headers for minimum grain shatter.")}</p>
                </div>
                <div className="mt-space-lg pt-space-sm bg-surface-container-low px-space-md py-space-sm rounded-lg flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Benchmark Rate:")}</span>
                  <span className="font-label-lg text-label-lg font-bold text-primary">{tYo("From ₦24,000 / Ha")}</span>
                </div>
              </div>

              <div
                onClick={() => {
                  setSelectedCategory("drone");
                  showScreenToast(tYo.now("Filtering by Drone Precision Scouting..."));
                }}
                className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between group cursor-pointer"
              >
                <div className="flex flex-col gap-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
                    <Icon name="biotech" className="text-[28px]" />
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">{tYo("Soil Testing & Agronomy Scouting")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Mobile field test labs equipped with electronic pH, NPK, and electrical conductivity testing kits. Verified fertilizer optimization prescriptions.")}</p>
                </div>
                <div className="mt-space-lg pt-space-sm bg-surface-container-low px-space-md py-space-sm rounded-lg flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Benchmark Rate:")}</span>
                  <span className="font-label-lg text-label-lg font-bold text-primary">{tYo("From ₦12,000 / Field")}</span>
                </div>
              </div>

              <div
                onClick={() => {
                  setSelectedCluster("all");
                  showScreenToast(tYo.now("Low-bed haulage trailers available across all SW clusters."));
                }}
                className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between group cursor-pointer"
              >
                <div className="flex flex-col gap-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
                    <Icon name="local_shipping" className="text-[28px]" />
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">{tYo("Haulage & Low-Loader Transport")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Heavy equipment low-bed mobilization trailers for point-to-point tractor and bulldozer haulage between inter-state farm clusters.")}</p>
                </div>
                <div className="mt-space-lg pt-space-sm bg-surface-container-low px-space-md py-space-sm rounded-lg flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Benchmark Rate:")}</span>
                  <span className="font-label-lg text-label-lg font-bold text-primary">{tYo("₦1,800 / Km loaded")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full bg-surface-container-low py-space-xl">
          <div className="max-w-7xl mx-auto px-margin-desktop flex flex-col gap-space-lg">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
              <div>
                <div className="flex items-center gap-space-xs">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">{tYo("Certified Machinery Fleet")}</span>
                </div>
                <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">{tYo("Active Mobilization Directory")}</h2>
              </div>
              <div className="flex items-center gap-space-sm font-label-sm text-label-sm text-on-surface-variant">
                <span>{tYo("Sort by:")}</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "fastest" | "price" | "rating")}
                  className="bg-surface-container-lowest px-space-sm py-1 rounded-md text-primary font-semibold shadow-sm focus:outline-none cursor-pointer"
                >
                  <option value="fastest">{tYo("Fastest Availability")}</option>
                  <option value="price">{tYo("Lowest Cost / Ha")}</option>
                  <option value="rating">{tYo("Highest Rating")}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
              {filteredList.map((item) => (
                <article key={item.id} className="bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
                  <div className="relative w-full h-48 bg-surface-container">
                    <img className="w-full h-full object-cover" data-alt={item.alt} src={item.image} alt="" loading="lazy" decoding="async" />
                    <div className={`absolute top-3 left-3 ${item.availabilityColor} font-label-sm text-label-sm px-space-sm py-0.5 rounded-full font-semibold flex items-center gap-1 shadow-sm`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> {tYo(item.availability)}
                    </div>
                    <div className="absolute bottom-3 right-3 bg-surface-container-lowest/95 backdrop-blur-sm text-primary font-label-md text-label-md px-space-sm py-0.5 rounded-md font-bold shadow-sm flex items-center gap-1">
                      <Icon name="star" className="text-tertiary-container text-[16px]" />
                      <span>{tYo(item.rating)}</span>
                      <span className="text-on-surface-variant font-normal">({tYo(item.jobsCount)}{tYo(" jobs)")}</span>
                    </div>
                  </div>
                  <div className="p-space-lg flex flex-col flex-1 justify-between gap-space-md">
                    <div className="flex flex-col gap-space-xs">
                      <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                        <Icon name="location_on" className="text-[16px] text-secondary" />
                        <span>{tYo(item.location)}</span>
                      </div>
                      <h3 className="font-headline-sm text-headline-sm text-primary font-bold">{tYo(item.name)}</h3>
                      <p className="font-label-sm text-label-sm text-on-surface-variant font-medium">{tYo("Syndicate: ")}{tYo(item.syndicate)}</p>
                    </div>
                    <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-1">
                      <div className="flex items-center justify-between text-body-sm font-body-sm">
                        <span className="text-on-surface-variant">{tYo("Operator:")}</span>
                        <span className="font-semibold text-on-surface flex items-center gap-1">{tYo(item.operator)} <Icon name="verified" className="text-secondary text-[14px]" /></span>
                      </div>
                      <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant">
                        <span>{tYo("Credentials:")}</span>
                        <span className="text-secondary font-medium">{tYo(item.credentials)}</span>
                      </div>
                      <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant pt-1 border-t border-surface-container">
                        <span>{tYo("Features:")}</span>
                        <span className="text-on-surface">{tYo(item.features)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-space-xs">
                      <div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant block">{tYo(item.rateLabel)}:</span>
                        <span className="font-headline-md text-headline-md text-primary font-bold">₦{item.rate.toLocaleString()}</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant"> {tYo(item.rateUnit)}</span>
                      </div>
                      <button
                        onClick={() => {
                          setBookingItem(item);
                          setBookingHectares(5);
                        }}
                        className="inline-flex items-center justify-center gap-1 bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md px-space-md py-2 rounded-lg font-semibold transition-colors shadow-sm cursor-pointer"
                        type="button"
                      >
                        <Icon name="lock" className="text-[16px]" />{tYo(" Request Booking")}</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md pt-space-md">
              <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Showing ")}<strong>{tYo(filteredList.length)}</strong>{tYo(" of ")}<strong>342</strong>{tYo(" verified mechanization listings across SW mesh")}</span>
              <div className="flex items-center gap-space-xs font-label-sm text-label-sm">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="w-8 h-8 rounded-lg bg-surface-container-lowest text-on-surface-variant shadow-sm flex items-center justify-center hover:bg-surface-container cursor-pointer disabled:opacity-40"
                  disabled={currentPage === 1}
                  type="button"
                >
                  <Icon name="chevron_left" className="text-[16px]" />
                </button>
                <button
                  onClick={() => setCurrentPage(1)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold cursor-pointer ${currentPage === 1 ? "bg-primary-container text-on-primary" : "bg-surface-container-lowest text-on-surface shadow-sm hover:bg-surface-container"}`}
                  type="button"
                >
                  1
                </button>
                <button
                  onClick={() => {
                    setCurrentPage(2);
                    showScreenToast(tYo.now("Viewing page 2: Additional 6 vetted contractor fleets."));
                  }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold cursor-pointer ${currentPage === 2 ? "bg-primary-container text-on-primary" : "bg-surface-container-lowest text-on-surface shadow-sm hover:bg-surface-container"}`}
                  type="button"
                >
                  2
                </button>
                <button
                  onClick={() => {
                    setCurrentPage(3);
                    showScreenToast(tYo.now("Viewing page 3: Specialized spray & harvesting units."));
                  }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold cursor-pointer ${currentPage === 3 ? "bg-primary-container text-on-primary" : "bg-surface-container-lowest text-on-surface shadow-sm hover:bg-surface-container"}`}
                  type="button"
                >
                  3
                </button>
                <span className="px-1 text-on-surface-variant">...</span>
                <button
                  onClick={() => {
                    setCurrentPage(29);
                    showScreenToast(tYo.now("Viewing page 29: Regional reserve syndicate fleets."));
                  }}
                  className="w-8 h-8 rounded-lg bg-surface-container-lowest text-on-surface shadow-sm hover:bg-surface-container flex items-center justify-center cursor-pointer"
                  type="button"
                >
                  29
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(29, p + 1))}
                  className="w-8 h-8 rounded-lg bg-surface-container-lowest text-on-surface-variant shadow-sm flex items-center justify-center hover:bg-surface-container cursor-pointer"
                  type="button"
                >
                  <Icon name="chevron_right" className="text-[16px]" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full bg-surface-container-lowest py-space-xl">
          <div className="max-w-7xl mx-auto px-margin-desktop flex flex-col gap-space-lg">
            <div className="text-center max-w-2xl mx-auto flex flex-col gap-space-xs">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">{tYo("Decentralized Escrow Verification")}</span>
              <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">{tYo("How Equipment Booking Works")}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">{tYo("Every field operation is protected by geospatial Proof-of-Work boundaries and CBN-compliant custodial vaults.")}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md pt-space-md">
              <div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col justify-between gap-space-md relative">
                <div className="flex items-center justify-between">
                  <span className="font-headline-md text-headline-md font-bold text-secondary">01</span>
                  <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm">
                    <Icon name="polyline" className="text-[20px]" />
                  </div>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold">{tYo("Define Geofenced Area")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Select your required implement and attach your PostGIS boundary polygon or farm GPS coordinates directly from your CultivaNode roster.")}</p>
                </div>
                <div className="text-secondary font-label-sm text-label-sm flex items-center gap-1">
                  <Icon name="pin_drop" className="text-[14px]" />
                  <span>{tYo("Accurate Hectare Calculation")}</span>
                </div>
              </div>

              <div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col justify-between gap-space-md relative">
                <div className="flex items-center justify-between">
                  <span className="font-headline-md text-headline-md font-bold text-secondary">02</span>
                  <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm">
                    <Icon name="account_balance_wallet" className="text-[20px]" />
                  </div>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold">{tYo("CBN Escrow Custody")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Deposit hiring funds into a Providus Bank escrow trust at 0% platform fee. Capital remains locked until field milestones are verified.")}</p>
                </div>
                <div className="text-secondary font-label-sm text-label-sm flex items-center gap-1">
                  <Icon name="shield" className="text-[14px]" />
                  <span>{tYo("Zero Advance Risk")}</span>
                </div>
              </div>

              <div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col justify-between gap-space-md relative">
                <div className="flex items-center justify-between">
                  <span className="font-headline-md text-headline-md font-bold text-secondary">03</span>
                  <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm">
                    <Icon name="satellite_alt" className="text-[20px]" />
                  </div>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold">{tYo("Track GPS Tillage PoW")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Tractor operator mobilizes. The on-board CultivaNode telemetry module transmits live boundary traversal tracks and time-stamped passes.")}</p>
                </div>
                <div className="text-secondary font-label-sm text-label-sm flex items-center gap-1">
                  <Icon name="timeline" className="text-[14px]" />
                  <span>{tYo("Live Telematics Dashboard")}</span>
                </div>
              </div>

              <div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col justify-between gap-space-md relative">
                <div className="flex items-center justify-between">
                  <span className="font-headline-md text-headline-md font-bold text-secondary">04</span>
                  <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm">
                    <Icon name="fact_check" className="text-[20px]" />
                  </div>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold">{tYo("Inspect & Release Funds")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{tYo("Review completed acreage. Farmer approves release via PIN/OTP within 48h or triggers an automated agricultural ADP arbitration review.")}</p>
                </div>
                <div className="text-secondary font-label-sm text-label-sm flex items-center gap-1">
                  <Icon name="verified" className="text-[14px]" />
                  <span>{tYo("Instant Syndicate Payout")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-space-xl">
          <div className="max-w-7xl mx-auto px-margin-desktop">
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col lg:flex-row gap-space-lg items-center">
              <div className="w-full lg:w-1/2 flex flex-col gap-space-md">
                <div className="inline-flex items-center gap-space-xs bg-surface-container px-space-md py-1 rounded-full self-start">
                  <Icon name="hub" className="text-[16px] text-secondary" />
                  <span className="font-label-sm text-label-sm text-on-surface font-semibold">{tYo("Active Mesh Coverage Map")}</span>
                </div>
                <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">{tYo("South-West Tractor Syndicates Live Dispatch Map")}</h2>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{tYo("CultivaNode synchronizes fleet pools across agrarian junctions in Oyo, Ogun, Ondo, and Osun to eliminate empty return journeys (deadhead transit) and maintain fuel economies of scale.")}</p>
                <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
                  <div className="p-space-sm bg-surface-container-low rounded-lg">
                    <span className="font-label-sm text-label-sm text-on-surface-variant block">{tYo("Oke-Ogun Corridor")}</span>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">{tYo("142 Units")}</span>
                    <span className="font-label-sm text-label-sm text-secondary block">{tYo("Saki, Iseyin, Kisi")}</span>
                  </div>
                  <div className="p-space-sm bg-surface-container-low rounded-lg">
                    <span className="font-label-sm text-label-sm text-on-surface-variant block">{tYo("Egba / Yewa Belt")}</span>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">{tYo("89 Units")}</span>
                    <span className="font-label-sm text-label-sm text-secondary block">{tYo("Abeokuta, Ilaro")}</span>
                  </div>
                  <div className="p-space-sm bg-surface-container-low rounded-lg">
                    <span className="font-label-sm text-label-sm text-on-surface-variant block">{tYo("Osun Agro Valley")}</span>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">{tYo("64 Units")}</span>
                    <span className="font-label-sm text-label-sm text-secondary block">{tYo("Osogbo, Ejigbo")}</span>
                  </div>
                  <div className="p-space-sm bg-surface-container-low rounded-lg">
                    <span className="font-label-sm text-label-sm text-on-surface-variant block">{tYo("Ondo Grain Basin")}</span>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">{tYo("47 Units")}</span>
                    <span className="font-label-sm text-label-sm text-secondary block">{tYo("Akure, Owo")}</span>
                  </div>
                </div>
              </div>
              <div className="w-full lg:w-1/2">
                <div
                  onClick={() => setShowMapModal(true)}
                  className="w-full h-80 rounded-xl bg-cover bg-center shadow-inner relative flex flex-col justify-end p-space-md cursor-pointer group"
                  data-location="Ibadan, Nigeria"
                  style={{ backgroundImage: "url('/images/screens/9107876e6c7f.webp')" }}
                >
                  <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/10 transition-colors rounded-xl flex items-center justify-center">
                    <span className="bg-surface-container-lowest/90 px-3 py-1.5 rounded-lg text-primary font-label-md text-label-md font-bold shadow-md flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                      <Icon name="map" className="text-[18px]" />{tYo(" Click to Inspect Live Dispatch Radar")}</span>
                  </div>
                  <div className="bg-surface-container-lowest/90 backdrop-blur-md p-space-sm rounded-lg shadow-sm flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-primary font-semibold">
                      <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
                      <span>{tYo("Live GPS Feed: 12 Machines operating right now in Saki West")}</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Updated 4m ago")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full pb-space-xl">
          <div className="max-w-7xl mx-auto px-margin-desktop">
            <div className="bg-primary-container text-on-primary rounded-xl p-space-lg lg:p-space-xl shadow-lg relative overflow-hidden">
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-lg">
                <div className="flex flex-col gap-space-sm max-w-2xl">
                  <div className="inline-flex items-center gap-space-xs bg-secondary/30 text-secondary-fixed font-label-sm text-label-sm px-space-md py-1 rounded-full uppercase tracking-wider font-semibold self-start">
                    <Icon name="electric_bolt" className="text-[14px]" />{tYo(" For Fleet Owners & Agrotech Coops")}</div>
                  <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-primary font-bold tracking-tight">{tYo("Own Tractors or Implements in South-West Nigeria? Put Idle Machines to Work.")}</h2>
                  <p className="font-body-md text-body-md text-on-primary-container leading-relaxed">{tYo("Guaranteed escrow payments, zero deadhead transit via demand clustering, verified operator management, and subsidized maintenance spare parts through regional agricultural development programs.")}</p>
                  <div className="flex flex-wrap items-center gap-space-md pt-space-xs font-label-sm text-label-sm text-on-primary">
                    <span className="flex items-center gap-1"><Icon name="verified" className="text-secondary-fixed text-[18px]" />{tYo(" 0% Listing Fee")}</span>
                    <span className="flex items-center gap-1"><Icon name="shield" className="text-secondary-fixed text-[18px]" />{tYo(" Instant 48h Escrow Settlements")}</span>
                    <span className="flex items-center gap-1"><Icon name="engineering" className="text-secondary-fixed text-[18px]" />{tYo(" Operator Safety & GPS Telematics Kits")}</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row lg:flex-col gap-space-sm w-full lg:w-auto shrink-0">
                  <button
                    onClick={() => setShowProviderModal(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-space-xs bg-secondary text-on-secondary hover:bg-secondary-fixed hover:text-on-secondary-fixed font-label-lg text-label-lg font-bold px-space-lg py-space-sm rounded-lg transition-colors shadow-sm cursor-pointer"
                    type="button"
                  >
                    <Icon name="add_circle" className="text-[20px]" />{tYo(" Register as Equipment Provider")}</button>
                  <button
                    onClick={handleDownloadHandbook}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-space-xs bg-surface-container-lowest text-on-surface hover:bg-surface-container font-label-lg text-label-lg font-semibold px-space-lg py-space-sm rounded-lg transition-colors shadow-sm cursor-pointer"
                    type="button"
                  >
                    <Icon name="download" className="text-[20px]" />{tYo(" Download Operator Handbook (PDF)")}</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Booking Modal */}
      {bookingItem && (
        <ScreenDialog
          title={tYo("Reserve Agricultural Equipment")}
          subtitle={`Deploy ${bookingItem.name} with Geofenced Escrow Protection`}
          onClose={() => setBookingItem(null)}
          panel={
            <div className="flex flex-col gap-space-md p-space-md">
              <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col gap-2">
                <div className="flex justify-between items-center text-label-md">
                  <span className="text-on-surface-variant">{tYo("Syndicate / Provider:")}</span>
                  <span className="font-bold text-on-surface">{tYo(bookingItem.syndicate)}</span>
                </div>
                <div className="flex justify-between items-center text-label-md">
                  <span className="text-on-surface-variant">{tYo("Lead Operator:")}</span>
                  <span className="font-semibold text-secondary flex items-center gap-1">{tYo(bookingItem.operator)} <Icon name="verified" className="text-[14px]" /></span>
                </div>
                <div className="flex justify-between items-center text-label-md">
                  <span className="text-on-surface-variant">{tYo("Unit Base Rate:")}</span>
                  <span className="font-bold text-primary">₦{bookingItem.rate.toLocaleString()} {tYo(bookingItem.rateUnit)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-space-xs">
                <label className="font-label-sm text-label-sm text-on-surface font-semibold">{tYo("Total Hectares Required:")}</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={bookingHectares}
                  onChange={(e) => setBookingHectares(Math.max(1, Number(e.target.value)))}
                  className="w-full h-11 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-md"
                />
              </div>

              <div className="flex flex-col gap-space-xs">
                <label className="font-label-sm text-label-sm text-on-surface font-semibold">{tYo("Escrow Custodian Bank:")}</label>
                <select
                  value={bookingBank}
                  onChange={(e) => setBookingBank(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-md"
                >
                  <option value="Zenith Bank">{tYo("Zenith Bank (CBN Agrarian Custody Trust)")}</option>
                  <option value="Providus Bank">{tYo("Providus Bank (Instant NIBSS Virtual Escrow)")}</option>
                  <option value="Paystack Vault">{tYo("Paystack Multi-Currency Escrow (Cards/USSD/Transfer)")}</option>
                  <option value="Flutterwave Escrow">{tYo("Flutterwave NGN/USD Agritech Vault")}</option>
                </select>
              </div>

              <div className="p-space-md bg-secondary/10 border border-secondary/20 rounded-xl flex flex-col gap-1">
                <div className="flex justify-between text-body-md">
                  <span className="text-on-surface-variant">{tYo("Total Escrow Deposit:")}</span>
                  <span className="font-headline-sm text-headline-sm font-bold text-primary">₦{(bookingItem.rate * bookingHectares).toLocaleString()}</span>
                </div>
                <span className="text-label-sm text-secondary flex items-center gap-1">
                  <Icon name="shield" className="text-[14px]" />{tYo(" Locked until GPS Proof-of-Work completes with zero damage")}</span>
              </div>

              <div className="flex justify-end gap-space-sm pt-space-xs">
                <ScreenDialogClose onClick={() => setBookingItem(null)}>{tYo("Cancel")}</ScreenDialogClose>
                <button
                  onClick={handleConfirmBooking}
                  className="px-space-lg py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container transition-colors cursor-pointer"
                  type="button"
                >{tYo("Deposit & Authorize Dispatch")}</button>
              </div>
            </div>
          }
        />
      )}

      {/* Provider Onboarding Modal */}
      {showProviderModal && (
        <ScreenDialog
          title={tYo("Register as Equipment Provider")}
          subtitle={tYo("Monetize idle machinery through verified South-West agrarian syndicates")}
          onClose={() => setShowProviderModal(false)}
          panel={
            <form onSubmit={handleRegisterProvider} className="flex flex-col gap-space-md p-space-md">
              <div className="flex flex-col gap-space-xs">
                <label className="font-label-sm text-label-sm text-on-surface font-semibold">{tYo("Syndicate / Organization Name *")}</label>
                <input
                  type="text"
                  required
                  placeholder={tYo("e.g., Oke-Ogun Mechanization Cooperative")}
                  value={providerForm.syndicateName}
                  onChange={(e) => setProviderForm({ ...providerForm, syndicateName: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-space-sm">
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label-sm text-label-sm text-on-surface font-semibold">{tYo("Equipment Type")}</label>
                  <select
                    value={providerForm.equipmentType}
                    onChange={(e) => setProviderForm({ ...providerForm, equipmentType: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm"
                  >
                    <option>{tYo("Tractor (75+ HP)")}</option>
                    <option>{tYo("Combine Harvester")}</option>
                    <option>{tYo("CAT D6 Bulldozer")}</option>
                    <option>{tYo("DJI Agras Drone")}</option>
                    <option>{tYo("Boom Sprayer")}</option>
                  </select>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label-sm text-label-sm text-on-surface font-semibold">{tYo("Primary Base LGA")}</label>
                  <select
                    value={providerForm.cluster}
                    onChange={(e) => setProviderForm({ ...providerForm, cluster: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm"
                  >
                    <option>{tYo("Oyo — Saki West")}</option>
                    <option>{tYo("Oyo — Iseyin")}</option>
                    <option>{tYo("Ogun — Abeokuta North")}</option>
                    <option>{tYo("Ondo — Akure Central")}</option>
                    <option>{tYo("Osun — Osogbo")}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-space-sm">
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label-sm text-label-sm text-on-surface font-semibold">{tYo("Registration / VIN")}</label>
                  <input
                    type="text"
                    placeholder={tYo("e.g. MF-2024-9912")}
                    value={providerForm.vinChassis}
                    onChange={(e) => setProviderForm({ ...providerForm, vinChassis: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm"
                  />
                </div>
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label-sm text-label-sm text-on-surface font-semibold">{tYo("Daily Benchmark Rate (₦)")}</label>
                  <input
                    type="number"
                    value={providerForm.dailyRate}
                    onChange={(e) => setProviderForm({ ...providerForm, dailyRate: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-space-xs">
                <label className="font-label-sm text-label-sm text-on-surface font-semibold">{tYo("Direct Phone / WhatsApp *")}</label>
                <input
                  type="tel"
                  required
                  placeholder="+234 803 000 0000"
                  value={providerForm.phone}
                  onChange={(e) => setProviderForm({ ...providerForm, phone: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm"
                />
              </div>

              <div className="flex justify-end gap-space-sm pt-space-xs">
                <ScreenDialogClose onClick={() => setShowProviderModal(false)}>{tYo("Cancel")}</ScreenDialogClose>
                <button
                  type="submit"
                  className="px-space-lg py-2.5 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-bold hover:bg-secondary-fixed transition-colors cursor-pointer"
                >{tYo("Submit Equipment Dossier")}</button>
              </div>
            </form>
          }
        />
      )}

      {/* Radar Map Modal */}
      {showMapModal && (
        <ScreenDialog
          title={tYo("South-West Telematics Fleet Radar")}
          subtitle={tYo("Live RTK GPS Telemetry of 342 Registered Implement Units")}
          onClose={() => setShowMapModal(false)}
          panel={
            <div className="flex flex-col gap-space-md p-space-md">
              <div className="w-full h-72 rounded-xl bg-surface-container relative overflow-hidden flex items-center justify-center border border-surface-container-high">
                <img src="/images/screens/442c1d15059d.webp" alt={tYo("Map Radar")} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-primary/20 flex flex-col items-center justify-center p-space-md text-center">
                  <div className="p-space-md rounded-xl bg-surface-container-lowest/90 backdrop-blur-md shadow-lg flex flex-col gap-2 max-w-md">
                    <span className="font-label-lg text-label-lg font-bold text-primary flex items-center justify-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping" />{tYo(" Active RTK Base Stations: Saki, Iseyin, Abeokuta")}</span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("24 Units actively transmitting live CAN-bus velocity and cadastral pass coordinates across UTM Zone 31N.")}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-label-sm">
                <div className="p-2 rounded-lg bg-surface-container-low">
                  <span className="text-on-surface-variant block">{tYo("Average Latency")}</span>
                  <span className="font-bold text-primary text-body-md">{tYo("8 seconds")}</span>
                </div>
                <div className="p-2 rounded-lg bg-surface-container-low">
                  <span className="text-on-surface-variant block">{tYo("Sub-meter RTK")}</span>
                  <span className="font-bold text-secondary text-body-md">{tYo("99.8% Online")}</span>
                </div>
                <div className="p-2 rounded-lg bg-surface-container-low">
                  <span className="text-on-surface-variant block">{tYo("PoW Settlement")}</span>
                  <span className="font-bold text-tertiary text-body-md">{tYo("Zero Breaches")}</span>
                </div>
              </div>
              <div className="flex justify-end pt-space-xs">
                <ScreenDialogClose onClick={() => setShowMapModal(false)}>{tYo("Close Radar")}</ScreenDialogClose>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
}
