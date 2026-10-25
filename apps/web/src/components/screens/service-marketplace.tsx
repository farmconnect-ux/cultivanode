"use client";

// Ported from the "service_machinery_marketplace" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogClose, showScreenToast } from "@/components/ds/screen-dialog";
import { slot, type ScreenProps } from "./types";

export type ServiceMarketplaceSlot = "search" | "kpis" | "tracker" | "listings";

interface ServiceListing {
  id: string;
  name: string;
  categoryTag: string;
  category: "tillage" | "sprayer" | "drone" | "mechanic";
  image: string;
  alt: string;
  status: string;
  distance: string;
  rating: number;
  powCount: number;
  description: string;
  capacityLabel: string;
  capacityValue: string;
  extraLabel: string;
  extraValue: string;
  rate: number;
  rateUnit: string;
  rateSub: string;
  btnLabel: string;
  btnIcon: string;
}

const LISTINGS: ServiceListing[] = [
  {
    id: "MF-375",
    name: "MF 375 (75 HP) + Disc Harrow",
    categoryTag: "Heavy Tillage Syndicate",
    category: "tillage",
    image: "/images/screens/95420bf3342b.webp",
    alt: "A clean industrial photograph of a rugged red Massey Ferguson 375 agricultural tractor",
    status: "Available Today",
    distance: "6km away",
    rating: 4.9,
    powCount: 34,
    description: "Ideal for primary ploughing and heavy virgin brush breakups. Includes certified operator and auxiliary fuel cache.",
    capacityLabel: "Daily Capacity:",
    capacityValue: "12–15 Hectares",
    extraLabel: "Settlement Mode:",
    extraValue: "Direct Post-Work",
    rate: 28000,
    rateUnit: "/ Hectare",
    rateSub: "+₦0 fee",
    btnLabel: "Book Equipment",
    btnIcon: "calendar_add_on",
  },
  {
    id: "BOOM-SPRAY",
    name: "High-Clearance Boom Sprayer",
    categoryTag: "Crop Protection Fleet",
    category: "sprayer",
    image: "/images/screens/f9fbfd6131d8.webp",
    alt: "High-clearance specialized agricultural boom sprayer vehicle in green and yellow livery",
    status: "Ready in 2h",
    distance: "11km away",
    rating: 4.8,
    powCount: 22,
    description: "18-meter wingspan, calibrated anti-drift nozzles for herbicides and foliage fertilizer. Operator & safety suite included.",
    capacityLabel: "Daily Capacity:",
    capacityValue: "30–40 Hectares",
    extraLabel: "Calibration Log:",
    extraValue: "Verified 3 Days Ago",
    rate: 15000,
    rateUnit: "/ Hectare",
    rateSub: "Excl. chemical",
    btnLabel: "Book Equipment",
    btnIcon: "calendar_add_on",
  },
  {
    id: "DRONE-NDVI",
    name: "Multispectral NDVI Aerial Mapping",
    categoryTag: "Precision Agronomy",
    category: "drone",
    image: "/images/screens/3f820cefce69.webp",
    alt: "A high tech commercial agricultural octocopter drone resting on a tripod ground pad",
    status: "Dispatched w/ Pilot",
    distance: "18km away",
    rating: 5.0,
    powCount: 19,
    description: "High resolution crop stress, water deficit, and canopy health analytics with same-day shapefile upload to CultivaNode.",
    capacityLabel: "Turnaround:",
    capacityValue: "Same-day Orthomosaic",
    extraLabel: "Pilot License:",
    extraValue: "NCAA Registered",
    rate: 8500,
    rateUnit: "/ Hectare",
    rateSub: "Min. 5 Ha",
    btnLabel: "Request Flight",
    btnIcon: "calendar_add_on",
  },
  {
    id: "MECH-DIESEL",
    name: "Field Hydraulic & Engine Specialist",
    categoryTag: "Technical Support & Fleet Care",
    category: "mechanic",
    image: "/images/screens/4d6d1087e6da.webp",
    alt: "An expert Nigerian male heavy diesel mechanic working on a large tractor engine bay",
    status: "On Call",
    distance: "Iseyin Center (4km)",
    rating: 4.9,
    powCount: 67,
    description: "Master diesel diagnostics, PTO rebuilds, steering rams, and emergency on-field breakdown rescue across Oyo North.",
    capacityLabel: "Response Time:",
    capacityValue: "< 45 minutes",
    extraLabel: "Toolkit:",
    extraValue: "Mobile Field Van",
    rate: 12000,
    rateUnit: "/ Base Visit",
    rateSub: "+ parts direct",
    btnLabel: "Dispatch Mechanic",
    btnIcon: "build",
  },
];

export function ServiceMarketplace({ lang = "en", slots }: ScreenProps<ServiceMarketplaceSlot>) {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("Rotary Weeding & Disc Harrows");
  const [selectedCluster, setSelectedCluster] = useState("Iseyin Hub");
  const [selectedEquipmentFilter, setSelectedEquipmentFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"proximity" | "rating">("proximity");

  // Dialog State
  const [showPowDrawer, setShowPowDrawer] = useState(false);
  const [showPostNeedModal, setShowPostNeedModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showClusterModal, setShowClusterModal] = useState(false);
  const [showGpsTrackModal, setShowGpsTrackModal] = useState(false);
  const [showFlagIssueModal, setShowFlagIssueModal] = useState(false);
  const [bookingItem, setBookingItem] = useState<ServiceListing | null>(null);

  // Forms
  const [needForm, setNeedForm] = useState({
    crop: "Cassava / Maize",
    hectares: "10",
    operation: "Rotary Weeding",
    date: "2026-04-15",
    location: "Iseyin Valley",
  });

  const [registerForm, setRegisterForm] = useState({
    syndicate: "",
    implement: "Tractor (75 HP)",
    operatorNIN: "",
    phone: "",
  });

  const handleApplyFilters = () => {
    showScreenToast(`Filters applied: ${selectedCluster} · Showing vetted syndicates.`);
  };

  const handleConfirmDirectSettlement = () => {
    showScreenToast("Proof-of-Work Approved! Direct payment voucher #SET-2026-0492 sent to Babatunde Gbadamosi.");
    setShowPowDrawer(false);
  };

  const handleRaiseDispute = () => {
    showScreenToast("Dispute logged for job BKG-2026-0492. Oyo ADP Arbiter assigned to inspect geofence.");
    setShowPowDrawer(false);
  };

  const handleJoinCluster = () => {
    showScreenToast("Your Plot A joined the 4-Farm Pooling Roster! Mobilization fee reduced from ₦35,000 to ₦8,750.");
    setShowClusterModal(false);
  };

  const handlePostNeedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const needRef = "NEED-RFQ-" + Math.floor(1000 + Math.random() * 9000);
    showScreenToast(`Machinery request posted to 14 regional syndicates. Ref: ${needRef}`);
    setShowPostNeedModal(false);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showScreenToast("Equipment registration received. Telematics onboarding team will contact you within 24h.");
    setShowRegisterModal(false);
  };

  const handleConfirmBooking = () => {
    if (!bookingItem) return;
    showScreenToast(`Direct engagement initiated with ${bookingItem.name}. Operator dispatched with zero platform fee.`);
    setBookingItem(null);
  };

  const sortedListings = [...LISTINGS].sort((a, b) => {
    if (sortBy === "rating") return b.rating - a.rating;
    return 0; // default proximity
  });

  return (
    <div className="screen">
      <div className="flex flex-col w-full pb-space-xl">
        <div className="relative overflow-hidden bg-primary text-on-primary rounded-xl p-space-lg shadow-md mb-space-lg">
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-secondary/20 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md mb-space-sm shadow-sm">
                <Icon name="verified" filled className="text-sm" />
                <span>0% COMMISSION IN THE PILOT · PAY THE PROVIDER DIRECTLY</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-primary font-bold tracking-tight">Hire machinery and farm help</h1>
              <p className="font-body-md text-body-md text-on-primary-container mt-1 max-w-2xl">Find tractor owners, operators and farm hands who travel to your farm. In the pilot you pay the provider directly after the job. Escrow (money held until you confirm the job) is coming once a licensed payment partner is signed.</p>
            </div>
            <div className="flex flex-wrap items-center gap-space-sm self-start lg:self-center">
              <Link
                href={`/${lang}/account/listings`}
                className="px-space-md py-space-sm bg-secondary text-on-secondary rounded-lg font-label-lg text-label-lg shadow-sm hover:bg-primary-container transition-colors flex items-center gap-space-xs"
              >
                <Icon name="agriculture" className="text-lg" />
                <span>List your equipment</span>
              </Link>
            </div>
          </div>

          {slot(slots, "search", (
            <div className="mt-space-lg pt-space-md bg-primary-container/40 rounded-lg p-space-sm grid grid-cols-1 md:grid-cols-12 gap-space-sm items-center">
              <div className="md:col-span-5 relative">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-primary-container text-lg" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-space-sm bg-surface-container-lowest text-on-surface rounded-lg font-body-md text-body-md focus:outline-none shadow-sm"
                  placeholder="Search tractors, boom sprayers, drone pilots, diesel mechanics..."
                  type="text"
                />
              </div>
              <div className="md:col-span-3 flex items-center bg-surface-container-lowest text-on-surface rounded-lg px-space-sm h-10 shadow-sm">
                <Icon name="near_me" className="text-secondary mr-2 text-lg" />
                <select
                  value={selectedCluster}
                  onChange={(e) => setSelectedCluster(e.target.value)}
                  className="w-full bg-transparent text-on-surface font-label-md text-label-md focus:outline-none cursor-pointer"
                >
                  <option value="Iseyin Hub">Iseyin Hub (25km Cluster Radius)</option>
                  <option value="Saki Belt">Saki Agricultural Belt (40km)</option>
                  <option value="Ogbomoso">Ogbomoso Savannah Corridor (50km)</option>
                  <option value="Oyo West">Oyo West Basin (15km)</option>
                </select>
              </div>
              <div className="md:col-span-2 flex items-center bg-surface-container-lowest text-on-surface rounded-lg px-space-sm h-10 shadow-sm">
                <Icon name="tune" className="text-secondary mr-2 text-lg" />
                <select
                  value={selectedEquipmentFilter}
                  onChange={(e) => setSelectedEquipmentFilter(e.target.value)}
                  className="w-full bg-transparent text-on-surface font-label-md text-label-md focus:outline-none cursor-pointer"
                >
                  <option value="all">All Equipment (28)</option>
                  <option value="tillage">Heavy Tractors (70+ HP)</option>
                  <option value="sprayer">Boom Sprayers &amp; Drones</option>
                  <option value="mechanic">Certified Mechanics</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <button
                  onClick={handleApplyFilters}
                  className="w-full h-10 bg-secondary-fixed text-on-secondary-fixed rounded-lg font-label-md text-label-md hover:bg-secondary-fixed-dim transition-colors flex items-center justify-center gap-1 cursor-pointer font-semibold"
                  type="button"
                >
                  <Icon name="filter_list" className="text-base" />
                  <span>Apply Filters</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {slot(slots, "kpis", (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-lg">
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center justify-between">
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Active Deployments</div>
                <div className="font-metric-num text-metric-num text-on-surface mt-1">4 <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">Jobs live</span></div>
                <div className="flex items-center gap-1 mt-1 text-secondary font-label-sm text-label-sm">
                  <span className="w-2 h-2 rounded-full bg-secondary-container animate-ping" />
                  <span>2 with active GPS telemetry</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-primary">
                <Icon name="pending_actions" className="text-2xl" />
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center justify-between">
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Fleet in Network</div>
                <div className="font-metric-num text-metric-num text-on-surface mt-1">28 <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">Units</span></div>
                <div className="flex items-center gap-1 mt-1 text-secondary font-label-sm text-label-sm">
                  <Icon name="verified" className="text-xs" />
                  <span>100% audited telematics</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-primary">
                <Icon name="precision_manufacturing" className="text-2xl" />
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center justify-between">
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Proof-of-Work Completed</div>
                <div className="font-metric-num text-metric-num text-on-surface mt-1">142 <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">Hectares</span></div>
                <div className="flex items-center gap-1 mt-1 text-secondary font-label-sm text-label-sm">
                  <Icon name="handshake" className="text-xs" />
                  <span>₦0 commission levied</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-primary">
                <Icon name="task_alt" className="text-2xl" />
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center justify-between">
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Aggregated Demand</div>
                <div className="font-metric-num text-metric-num text-on-surface mt-1">3 <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">Clusters</span></div>
                <div className="flex items-center gap-1 mt-1 text-tertiary-container font-label-sm text-label-sm">
                  <Icon name="local_shipping" className="text-xs" />
                  <span>45% transit discount pooled</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-primary">
                <Icon name="hub" className="text-2xl" />
              </div>
            </div>
          </div>
        ))}

        {slot(slots, "tracker", (
          <div className="bg-surface-container-lowest rounded-xl shadow-sm mb-space-lg overflow-hidden">
            <div className="p-space-md bg-surface-container flex flex-wrap items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-sm">
                <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-secondary">
                  <span className="w-1.5 h-1.5 rounded-full bg-surface-container-lowest animate-ping" />
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Live Execution &amp; PoW Tracker</span>
                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">In Progress (Plot A1)</span>
              </div>
              <div className="flex items-center gap-space-sm">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Booking ID: <strong className="text-on-surface font-mono">BKG-2026-0492</strong></span>
                <span className="text-on-surface-variant">·</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Settlement Protocol: <strong className="text-secondary font-semibold">Direct Bank/Cash on Delivery</strong></span>
              </div>
            </div>

            <div className="p-space-lg grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
              <div className="lg:col-span-7 flex flex-col justify-between space-y-space-md">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-space-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-headline-md text-headline-md text-on-surface font-bold">John Deere 5075E (75 HP MFWD)</h3>
                        <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-mono text-xs">OYO-982-KW</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Operation: <strong className="text-on-surface">Mechanical Rotary Weeding</strong> · Farm Sector: <strong className="text-on-surface">Plot A1 Cassava Intercrop (9.0 Ha)</strong></p>
                    </div>
                    <div className="text-right">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Direct Settlement Fee</span>
                      <div className="font-metric-num text-metric-num text-primary font-bold">₦95,000</div>
                      <span className="font-label-sm text-label-sm text-secondary font-medium">₦0 Platform Escrow Levy</span>
                    </div>
                  </div>

                  <div className="mt-space-md p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-space-sm">
                      <img className="w-10 h-10 rounded-full object-cover shadow-sm" data-alt="Babatunde Gbadamosi operator photo" src="/images/screens/47ca5be3ef95.webp" alt="" loading="lazy" decoding="async" />
                      <div>
                        <div className="font-label-md text-label-md text-on-surface font-bold">Babatunde Gbadamosi</div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">Alhaji Kazeem Syndicate (Verified Provider) · ★ 4.95 (48 jobs)</div>
                      </div>
                    </div>
                    <a className="px-3 py-1.5 bg-surface-container-lowest text-primary rounded-lg font-label-sm text-label-sm shadow-sm hover:bg-surface-container-high flex items-center gap-1 transition-colors" href="tel:08000000000">
                      <Icon name="phone" className="text-sm" />
                      <span>Call Operator</span>
                    </a>
                  </div>

                  <div className="mt-space-md space-y-space-sm">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Hectare Work Done (GPS Polygons Logged)</span>
                        <span className="font-label-md text-label-md text-primary font-bold">6.2 Ha of 9.0 Ha (68.8%)</span>
                      </div>
                      <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-secondary transition-all duration-500" style={{ width: "68.8%" }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-space-sm pt-2">
                      <div className="p-space-sm bg-surface-container-low rounded-lg">
                        <div className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                          <Icon name="speed" className="text-xs text-secondary" />
                          <span>Engine RPM</span>
                        </div>
                        <div className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">1,420 <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">RPM</span></div>
                        <span className="font-label-sm text-label-sm text-secondary">Nominal PTO Load</span>
                      </div>
                      <div className="p-space-sm bg-surface-container-low rounded-lg">
                        <div className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                          <Icon name="explore" className="text-xs text-secondary" />
                          <span>Ground Velocity</span>
                        </div>
                        <div className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">5.4 <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">km/h</span></div>
                        <span className="font-label-sm text-label-sm text-secondary">Optimum Weeding Pace</span>
                      </div>
                      <div className="p-space-sm bg-surface-container-low rounded-lg">
                        <div className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                          <Icon name="fence" className="text-xs text-secondary" />
                          <span>Geofence Status</span>
                        </div>
                        <div className="font-headline-sm text-headline-sm text-secondary font-bold mt-1">Locked In</div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">0 Boundary Breaches</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-space-sm flex flex-wrap items-center gap-space-sm">
                  <button
                    onClick={() => setShowPowDrawer(true)}
                    className="px-space-md py-space-sm bg-primary text-on-primary rounded-lg font-label-md text-label-md shadow-sm hover:bg-primary-container transition-colors flex items-center gap-2 cursor-pointer"
                    type="button"
                  >
                    <Icon name="verified" className="text-base" />
                    <span>Review Proof Photos &amp; Settle</span>
                  </button>
                  <button
                    onClick={() => setShowGpsTrackModal(true)}
                    className="px-space-md py-space-sm bg-surface-container-low text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container-high transition-colors flex items-center gap-2 cursor-pointer"
                    type="button"
                  >
                    <Icon name="route" className="text-base" />
                    <span>Inspect Real-Time GPS Track</span>
                  </button>
                  <button
                    onClick={() => setShowFlagIssueModal(true)}
                    className="px-space-md py-space-sm bg-surface-container-low text-error rounded-lg font-label-md text-label-md hover:bg-error-container transition-colors flex items-center gap-2 ml-auto cursor-pointer"
                    type="button"
                  >
                    <Icon name="report" className="text-base" />
                    <span>Flag Issue / Boundary Alert</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col justify-between">
                <div
                  onClick={() => setShowGpsTrackModal(true)}
                  className="relative w-full h-64 lg:h-full min-h-[260px] rounded-xl overflow-hidden shadow-inner bg-surface-container cursor-pointer group"
                  data-location="Iseyin, Nigeria"
                  style={{ backgroundImage: "url('/images/screens/106681f379f9.webp')" }}
                >
                  <div className="absolute top-3 left-3 bg-surface-container-lowest/90 backdrop-blur-md p-2 rounded-lg shadow-sm text-xs font-mono space-y-0.5">
                    <div className="flex items-center gap-1 text-primary font-bold">
                      <span className="w-2 h-2 rounded-full bg-secondary" />
                      <span>GPS FIX: RTK ACCURACY (±2.5cm)</span>
                    </div>
                    <div className="text-on-surface-variant">LAT: 7.9621° N · LON: 3.5932° E</div>
                    <div className="text-on-surface-variant">BOUNDS: PLOT A1 (POLY-9812-CULTIVA)</div>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-surface-container-lowest/95 backdrop-blur-md p-2 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface">
                      <Icon name="timelapse" className="text-base text-secondary" />
                      <span>Estimated finish: Today, 16:45 WAT</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {slot(slots, "listings", (
          <div className="space-y-space-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Verified Machinery &amp; Technical Services Near You</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">All equipment vetted with physical frame inspection, calibration reports, and verified operator credentials.</p>
              </div>
              <div className="flex items-center gap-space-sm">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Sort by:</span>
                <button
                  onClick={() => setSortBy("proximity")}
                  className={`px-space-sm py-1 rounded-lg font-label-sm text-label-sm cursor-pointer transition-colors ${sortBy === "proximity" ? "bg-surface-container-lowest text-on-surface shadow-sm font-bold" : "bg-surface-container text-on-surface-variant hover:text-on-surface"}`}
                  type="button"
                >
                  Closest Proximity
                </button>
                <button
                  onClick={() => setSortBy("rating")}
                  className={`px-space-sm py-1 rounded-lg font-label-sm text-label-sm cursor-pointer transition-colors ${sortBy === "rating" ? "bg-surface-container-lowest text-on-surface shadow-sm font-bold" : "bg-surface-container text-on-surface-variant hover:text-on-surface"}`}
                  type="button"
                >
                  Highest Rating
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
              {sortedListings.map((item) => (
                <div key={item.id} className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="relative h-44 w-full overflow-hidden bg-surface-container">
                      <img className="w-full h-full object-cover" data-alt={item.alt} src={item.image} alt="" loading="lazy" decoding="async" />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">{item.status}</span>
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-surface-container-lowest/90 font-label-sm text-label-sm text-on-surface font-mono">{item.distance}</span>
                    </div>
                    <div className="p-space-md">
                      <div className="flex items-center justify-between">
                        <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase">{item.categoryTag}</span>
                        <div className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface">
                          <Icon name="star" filled className="text-sm text-amber-500" />
                          <span className="font-bold">{item.rating}</span>
                          <span className="text-on-surface-variant">({item.powCount} PoW)</span>
                        </div>
                      </div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">{item.name}</h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-2">{item.description}</p>
                      <div className="mt-space-md pt-space-sm bg-surface-container-low rounded-lg p-space-sm space-y-1">
                        <div className="flex justify-between font-label-sm text-label-sm">
                          <span className="text-on-surface-variant">{item.capacityLabel}</span>
                          <span className="font-semibold text-on-surface">{item.capacityValue}</span>
                        </div>
                        <div className="flex justify-between font-label-sm text-label-sm">
                          <span className="text-on-surface-variant">{item.extraLabel}</span>
                          <span className="font-semibold text-secondary">{item.extraValue}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-space-md pt-0">
                    <div className="flex items-baseline justify-between mb-space-sm">
                      <div>
                        <span className="font-metric-num text-metric-num text-primary font-bold">₦{item.rate.toLocaleString()}</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">{item.rateUnit}</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{item.rateSub}</span>
                    </div>
                    <button
                      onClick={() => setBookingItem(item)}
                      className="w-full py-space-sm bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary-container transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      type="button"
                    >
                      <Icon name={item.btnIcon as any} className="text-base" />
                      <span>{item.btnLabel}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* PoW Review Modal */}
      {showPowDrawer && (
        <ScreenDialog
          title="Proof-of-Work Inspection: Job #BKG-2026-0492"
          subtitle="Pilot Zero-Custody Direct Settlement Policy"
          onClose={() => setShowPowDrawer(false)}
          panel={
            <div className="flex flex-col gap-space-md p-space-md">
              <div className="p-space-md bg-surface-container-low rounded-xl">
                <div className="flex items-start gap-space-sm">
                  <Icon name="handshake" className="text-secondary text-2xl shrink-0" />
                  <div>
                    <h4 className="font-label-lg text-label-lg text-on-surface font-bold">Pilot Zero-Custody Direct Settlement Policy</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">CultivaNode charges 0% fees and holds zero escrow funds. Review the automated boundary logs and proof photos below. If satisfied, confirm settlement and pay the operator directly via your preferred bank transfer or cash.</p>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-low rounded-xl p-space-md space-y-space-sm">
                <div className="flex items-center justify-between font-body-sm text-body-sm">
                  <span className="text-on-surface-variant flex items-center gap-1.5"><Icon name="check_circle" className="text-sm text-secondary" /> GPS Check-In Timestamp:</span>
                  <span className="font-mono font-semibold text-on-surface">Today, 08:14:02 WAT</span>
                </div>
                <div className="flex items-center justify-between font-body-sm text-body-sm">
                  <span className="text-on-surface-variant flex items-center gap-1.5"><Icon name="check_circle" className="text-sm text-secondary" /> Target Geofence Polygon:</span>
                  <span className="font-mono font-semibold text-on-surface">Plot A1 Boundary (9.0 Ha registered)</span>
                </div>
                <div className="flex items-center justify-between font-body-sm text-body-sm">
                  <span className="text-on-surface-variant flex items-center gap-1.5"><Icon name="check_circle" className="text-sm text-secondary" /> Recorded Swath Trajectory:</span>
                  <span className="font-mono font-semibold text-primary font-bold">6.2 Ha Verified Logged</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-space-sm">
                <div className="space-y-1">
                  <div className="relative h-36 rounded-lg overflow-hidden bg-surface-container">
                    <img className="w-full h-full object-cover" data-alt="Before photo" src="/images/screens/bb46e5e22e06.webp" alt="" />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-on-surface/80 text-surface font-label-sm text-label-sm font-bold">BEFORE WEEDING</span>
                  </div>
                  <div className="font-mono text-xs text-on-surface-variant">08:21 WAT · Coord: 7.962, 3.593</div>
                </div>
                <div className="space-y-1">
                  <div className="relative h-36 rounded-lg overflow-hidden bg-surface-container">
                    <img className="w-full h-full object-cover" data-alt="After photo" src="/images/screens/a23460ee0b59.webp" alt="" />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-secondary text-on-secondary font-label-sm text-label-sm font-bold">AFTER WEEDING</span>
                  </div>
                  <div className="font-mono text-xs text-on-surface-variant">14:10 WAT · Coord: 7.964, 3.595</div>
                </div>
              </div>

              <div className="p-space-md bg-surface-container-high rounded-xl space-y-space-xs">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">Direct Settlement Bank Details</span>
                <div className="flex justify-between items-center pt-1 font-body-sm text-body-sm">
                  <span className="text-on-surface-variant">Bank Name:</span>
                  <span className="font-semibold text-on-surface">First Bank of Nigeria</span>
                </div>
                <div className="flex justify-between items-center font-body-sm text-body-sm">
                  <span className="text-on-surface-variant">Account Number:</span>
                  <span className="font-mono font-bold text-primary tracking-wider">3098741029</span>
                </div>
                <div className="flex justify-between items-center font-body-sm text-body-sm">
                  <span className="text-on-surface-variant">Account Name:</span>
                  <span className="font-semibold text-on-surface">Alhaji Kazeem Syndicate Ent.</span>
                </div>
                <div className="flex justify-between items-center pt-2 font-headline-sm text-headline-sm">
                  <span className="font-bold text-on-surface">Net Agreed Fee:</span>
                  <span className="font-bold text-primary">₦95,000.00</span>
                </div>
              </div>

              <div className="flex justify-between gap-space-sm pt-space-xs">
                <button
                  onClick={handleRaiseDispute}
                  className="px-space-md py-2.5 rounded-lg bg-surface-container text-error hover:bg-error-container font-label-md cursor-pointer"
                  type="button"
                >
                  Raise Dispute
                </button>
                <div className="flex gap-2">
                  <ScreenDialogClose onClick={() => setShowPowDrawer(false)}>Cancel</ScreenDialogClose>
                  <button
                    onClick={handleConfirmDirectSettlement}
                    className="px-space-lg py-2.5 rounded-lg bg-primary text-on-primary font-label-md font-bold hover:bg-primary-container cursor-pointer"
                    type="button"
                  >
                    Approve PoW &amp; Confirm Direct Settlement
                  </button>
                </div>
              </div>
            </div>
          }
        />
      )}

      {/* Post Need Modal */}
      {showPostNeedModal && (
        <ScreenDialog
          title="Post Machinery Request"
          subtitle="Broadcast to 28 vetted tractor syndicates within your cluster"
          onClose={() => setShowPostNeedModal(false)}
          panel={
            <form onSubmit={handlePostNeedSubmit} className="flex flex-col gap-space-md p-space-md">
              <div className="grid grid-cols-2 gap-space-sm">
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm font-semibold">Operation Needed</label>
                  <select
                    value={needForm.operation}
                    onChange={(e) => setNeedForm({ ...needForm, operation: e.target.value })}
                    className="h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm"
                  >
                    <option>Disc Plowing</option>
                    <option>Rotary Weeding</option>
                    <option>Boom Spraying</option>
                    <option>Combine Harvesting</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm font-semibold">Acreage (Hectares)</label>
                  <input
                    type="number"
                    value={needForm.hectares}
                    onChange={(e) => setNeedForm({ ...needForm, hectares: e.target.value })}
                    className="h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-space-sm">
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm font-semibold">Desired Start Date</label>
                  <input
                    type="date"
                    value={needForm.date}
                    onChange={(e) => setNeedForm({ ...needForm, date: e.target.value })}
                    className="h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm font-semibold">Location / Plot</label>
                  <input
                    type="text"
                    value={needForm.location}
                    onChange={(e) => setNeedForm({ ...needForm, location: e.target.value })}
                    className="h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-space-sm pt-space-xs">
                <ScreenDialogClose onClick={() => setShowPostNeedModal(false)}>Cancel</ScreenDialogClose>
                <button type="submit" className="px-space-lg py-2.5 rounded-lg bg-primary text-on-primary font-label-md font-bold cursor-pointer">
                  Broadcast Request (0% Commission)
                </button>
              </div>
            </form>
          }
        />
      )}

      {/* Register Equipment Modal */}
      {showRegisterModal && (
        <ScreenDialog
          title="Register Equipment Syndicate"
          subtitle="Onboard tractors and implements with automated PoW geofencing"
          onClose={() => setShowRegisterModal(false)}
          panel={
            <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-space-md p-space-md">
              <div className="flex flex-col gap-1">
                <label className="font-label-sm font-semibold">Syndicate / Fleet Entity Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oke-Ogun Mechanized Farmers Union"
                  value={registerForm.syndicate}
                  onChange={(e) => setRegisterForm({ ...registerForm, syndicate: e.target.value })}
                  className="h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-space-sm">
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm font-semibold">Equipment Type</label>
                  <select
                    value={registerForm.implement}
                    onChange={(e) => setRegisterForm({ ...registerForm, implement: e.target.value })}
                    className="h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm"
                  >
                    <option>Tractor (75 HP)</option>
                    <option>High-Clearance Sprayer</option>
                    <option>Drone DJI Agras</option>
                    <option>Combine Harvester</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm font-semibold">Lead Operator NIN</label>
                  <input
                    type="text"
                    required
                    placeholder="11 digits"
                    value={registerForm.operatorNIN}
                    onChange={(e) => setRegisterForm({ ...registerForm, operatorNIN: e.target.value })}
                    className="h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-sm font-semibold">Contact Phone (WhatsApp)</label>
                <input
                  type="tel"
                  required
                  placeholder="+234 800 000 0000"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  className="h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm"
                />
              </div>
              <div className="flex justify-end gap-space-sm pt-space-xs">
                <ScreenDialogClose onClick={() => setShowRegisterModal(false)}>Cancel</ScreenDialogClose>
                <button type="submit" className="px-space-lg py-2.5 rounded-lg bg-secondary text-on-secondary font-label-md font-bold cursor-pointer">
                  Submit Fleet Dossier
                </button>
              </div>
            </form>
          }
        />
      )}

      {/* Cluster Mobilization Modal */}
      {showClusterModal && (
        <ScreenDialog
          title="Join Pooled Cluster Dispatch"
          subtitle="Iseyin South Savannah Block (36.0 Hectares Harrowing)"
          onClose={() => setShowClusterModal(false)}
          panel={
            <div className="flex flex-col gap-space-md p-space-md">
              <div className="p-space-sm bg-surface-container-low rounded-xl">
                <span className="font-label-md font-bold text-on-surface">Participating Farms in this Cluster:</span>
                <ul className="text-body-sm space-y-1 text-on-surface-variant mt-1">
                  <li>• Afolabi Organic Farm (12 Ha) — Confirmed</li>
                  <li>• Kasali Grain Hub (8 Ha) — Confirmed</li>
                  <li>• Alade Ridge Farm (7 Ha) — Confirmed</li>
                  <li>• Your Farm Sector (9 Ha) — Ready to Lock</li>
                </ul>
              </div>
              <div className="p-space-sm bg-secondary/10 border border-secondary/20 rounded-xl">
                <div className="flex justify-between items-center text-body-md font-bold text-primary">
                  <span>Pooled Rate per Hectare:</span>
                  <span>₦26,500 / Ha (Save ₦8,500/Ha)</span>
                </div>
                <span className="text-label-sm text-secondary block mt-0.5">Heavy transport trailer fee split equally 4-ways</span>
              </div>
              <div className="flex justify-end gap-space-sm pt-space-xs">
                <ScreenDialogClose onClick={() => setShowClusterModal(false)}>Cancel</ScreenDialogClose>
                <button
                  onClick={handleJoinCluster}
                  className="px-space-lg py-2.5 rounded-lg bg-primary text-on-primary font-label-md font-bold cursor-pointer"
                  type="button"
                >
                  Confirm Cluster Participation
                </button>
              </div>
            </div>
          }
        />
      )}

      {/* Real-time GPS Track Modal */}
      {showGpsTrackModal && (
        <ScreenDialog
          title="Real-Time GPS Swath Trajectory"
          subtitle="Plot A1 RTK Satellite Breadcrumbs (±2.5cm Precision)"
          onClose={() => setShowGpsTrackModal(false)}
          panel={
            <div className="flex flex-col gap-space-md p-space-md">
              <div className="w-full h-72 rounded-xl bg-surface-container relative overflow-hidden flex items-center justify-center">
                <img src="/images/screens/442c1d15059d.webp" alt="GPS Track" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-primary/20 flex flex-col justify-between p-space-md">
                  <div className="flex justify-between items-center">
                    <span className="bg-surface-container-lowest/90 px-3 py-1 rounded text-primary font-bold text-label-sm">
                      Swath Passes: 14 of 18 Completed
                    </span>
                    <span className="bg-surface-container-lowest/90 px-2 py-1 rounded text-secondary font-mono text-xs font-bold">
                      RTK FIX: 100%
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-space-xs">
                <ScreenDialogClose onClick={() => setShowGpsTrackModal(false)}>Close GPS View</ScreenDialogClose>
              </div>
            </div>
          }
        />
      )}

      {/* Flag Issue Modal */}
      {showFlagIssueModal && (
        <ScreenDialog
          title="Flag Issue / Boundary Alert"
          subtitle="Notify syndicate operator and local extension agent of an impediment"
          onClose={() => setShowFlagIssueModal(false)}
          panel={
            <div className="flex flex-col gap-space-md p-space-md">
              <textarea
                rows={4}
                className="w-full p-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm"
                placeholder="Describe issue (e.g. unmapped bedrock, buried irrigation pipe, livestock breach)..."
              />
              <div className="flex justify-end gap-space-sm pt-space-xs">
                <ScreenDialogClose onClick={() => setShowFlagIssueModal(false)}>Cancel</ScreenDialogClose>
                <button
                  onClick={() => {
                    showScreenToast("Boundary alert broadcast to operator and OYSADEP hub.");
                    setShowFlagIssueModal(false);
                  }}
                  className="px-space-md py-2.5 rounded-lg bg-error text-on-error font-label-md font-bold cursor-pointer"
                  type="button"
                >
                  Transmit Immediate Alert
                </button>
              </div>
            </div>
          }
        />
      )}

      {/* Booking Item Modal */}
      {bookingItem && (
        <ScreenDialog
          title={`Engage ${bookingItem.name}`}
          subtitle={`${bookingItem.categoryTag} · Direct Settlement Rate: ₦${bookingItem.rate.toLocaleString()} ${bookingItem.rateUnit}`}
          onClose={() => setBookingItem(null)}
          panel={
            <div className="flex flex-col gap-space-md p-space-md">
              <p className="text-body-sm text-on-surface-variant">{bookingItem.description}</p>
              <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col gap-1.5">
                <div className="flex justify-between text-body-sm">
                  <span>Proximity:</span>
                  <span className="font-semibold text-on-surface">{bookingItem.distance}</span>
                </div>
                <div className="flex justify-between text-body-sm">
                  <span>Historical Rating:</span>
                  <span className="font-semibold text-secondary">{bookingItem.rating}★ ({bookingItem.powCount} PoW)</span>
                </div>
                <div className="flex justify-between text-body-sm">
                  <span>Base Rate:</span>
                  <span className="font-bold text-primary">₦{bookingItem.rate.toLocaleString()} {bookingItem.rateUnit}</span>
                </div>
              </div>
              <div className="flex justify-end gap-space-sm pt-space-xs">
                <ScreenDialogClose onClick={() => setBookingItem(null)}>Cancel</ScreenDialogClose>
                <button
                  onClick={handleConfirmBooking}
                  className="px-space-lg py-2.5 rounded-lg bg-primary text-on-primary font-label-md font-bold cursor-pointer"
                  type="button"
                >
                  Confirm Direct Booking
                </button>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
}
