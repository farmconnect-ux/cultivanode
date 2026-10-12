"use client";

// Ported from the "produce_buyer_aggregator_hub" design. Interactive client workspace
// with purchase requirement modal, weighbridge slot booking, sourcing dossier export, and live ticket authorization.
import { useState } from "react";
import { Icon } from "@/components/ds/icon";
import { downloadFile } from "@/lib/download";
import { ScreenDialog, ScreenDialogClose, showScreenToast } from "@/components/ds/screen-dialog";
import type { ScreenProps } from "./types";

interface LotItem {
  id: string;
  location: string;
  cluster: string;
  farmers: string;
  commodity: string;
  spec: string;
  volume: string;
  bags: string;
  traceability: string;
  traceType: string;
  quality: string;
  qualityNote: string;
  status: string;
  statusType: "ready" | "transit" | "passed" | "lab";
  actionLabel: string;
  actionIcon: string;
}

const ALL_LOTS: LotItem[] = [
  {
    id: "#LOT-ISY-992",
    location: "Iseyin East Aggregation Depo",
    cluster: "Iseyin Savanna Syndicate",
    farmers: "32 Smallholders · Lead: B. Lawal",
    commodity: "Yellow Maize (SAMMAZ-52)",
    spec: "Weevils: 0/kg · Grade 1 Cleaned",
    volume: "85.0 MT",
    bags: "1,700 Bags",
    traceability: "GPS Verified",
    traceType: "NFC Tagged Bags",
    quality: "12.6% H₂O",
    qualityNote: "Pass Spec (≤13%)",
    status: "Ready for Haulage",
    statusType: "ready",
    actionLabel: "Dispatch Logistics",
    actionIcon: "local_shipping",
  },
  {
    id: "#LOT-ADO-401",
    location: "Ado-Awaye Farm Gate",
    cluster: "Ado Outgrowers Union",
    farmers: "18 Farmers · Lead: A. Tijani",
    commodity: "Cassava Roots (TME 419)",
    spec: "Harvest: 6h ago (Ultra-Fresh)",
    volume: "120.0 MT",
    bags: "Bulk Tipper Haul",
    traceability: "Farm Geo-Polygon",
    traceType: "Batch #CAS-8819",
    quality: "Starch: 25.8%",
    qualityNote: "Above Baseline (≥24%)",
    status: "Truck En Route",
    statusType: "transit",
    actionLabel: "Track Hauler GPS",
    actionIcon: "my_location",
  },
  {
    id: "#LOT-SAK-118",
    location: "Oke-Ogun Northern Transit Hub",
    cluster: "Oke-Ogun Soya Alliance",
    farmers: "24 Farmers · Lead: F. Ojo",
    commodity: "Non-GMO Soybean (TGX-1448E)",
    spec: "Foreign Matter: 0.9% max",
    volume: "45.0 MT",
    bags: "900x 50kg Polylined",
    traceability: "Lab Certified",
    traceType: "Trace ID #SY-9921",
    quality: "10.4% H₂O",
    qualityNote: "Oil Index: 19.8%",
    status: "Quality Passed",
    statusType: "passed",
    actionLabel: "Release ₦30.6M Escrow",
    actionIcon: "payments",
  },
  {
    id: "#LOT-EGB-055",
    location: "Abeokuta South Consolidation",
    cluster: "Egba Rice Growers Co-op",
    farmers: "15 Farmers · Lead: K. Balogun",
    commodity: "Paddy Rice (Faro 44 Long Grain)",
    spec: "Target Milling: 68%",
    volume: "38.0 MT",
    bags: "760 Bags",
    traceability: "Barcode Tagged",
    traceType: "Plot Verification Open",
    quality: "Sampling In Progress",
    qualityNote: "Moisture: 13.2% (Pending)",
    status: "Lab Inspection",
    statusType: "lab",
    actionLabel: "Upload Lab Cert",
    actionIcon: "biotech",
  },
];

export function BuyerHub(_props: ScreenProps) {
  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const [showWeighbridgeModal, setShowWeighbridgeModal] = useState(false);
  const [showFleetMapModal, setShowFleetMapModal] = useState(false);
  const [ticketAuthorized, setTicketAuthorized] = useState(false);
  const [mandatesCount, setMandatesCount] = useState(6);

  // Filters & State
  const [mandateCategory, setMandateCategory] = useState<"all" | "grains" | "tubers" | "legumes">("all");
  const [lotSearch, setLotSearch] = useState("");
  const [lotStatusFilter, setLotStatusFilter] = useState<string>("ALL");
  const [showFilterStatusModal, setShowFilterStatusModal] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals for Mandate Cards
  const [showInspectLotsModal, setShowInspectLotsModal] = useState(false);
  const [showHarvesterRosterModal, setShowHarvesterRosterModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showConsolidateRiceModal, setShowConsolidateRiceModal] = useState(false);

  // Modals for Lot Actions
  const [dispatchModalLot, setDispatchModalLot] = useState<LotItem | null>(null);
  const [trackGpsModalLot, setTrackGpsModalLot] = useState<LotItem | null>(null);
  const [escrowModalLot, setEscrowModalLot] = useState<LotItem | null>(null);
  const [labCertModalLot, setLabCertModalLot] = useState<LotItem | null>(null);

  // Form states
  const [reqCommodity, setReqCommodity] = useState("Yellow Feed Maize (SAMMAZ-52)");
  const [reqVolume, setReqVolume] = useState("500");
  const [reqPrice, setReqPrice] = useState("420000");
  const [reqOfftaker, setReqOfftaker] = useState("Grand Cereals Ltd");
  const [reqCorridor, setReqCorridor] = useState("Oyo (Iseyin, Saki)");

  const [wbTerminal, setWbTerminal] = useState("Ibadan Processing Hub Gate #2");
  const [wbVehicle, setWbVehicle] = useState("OYO-442-XA");
  const [wbDriver, setWbDriver] = useState("Lateef Adeleke");
  const [wbSlot, setWbSlot] = useState("2026-04-18T10:00");

  const handleExportDossier = () => {
    const csv = [
      "Requirement_ID,Commodity,Offtaker,Target_MT,Price_Per_MT_NGN,Corridor,Status",
      "REQ-BUY-2026-01,Yellow Feed Maize,Grand Cereals Ltd,600,420000,Oyo (Iseyin & Saki),Active",
      "REQ-BUY-2026-02,Industrial Cassava,Psaltry International,500,115000,Ogun & Oyo,Active",
      "REQ-BUY-2026-03,Non-GMO Soybean,Premium Edible Oils,250,680000,Osun Refining Complex,Open Bids",
      "REQ-BUY-2026-04,Paddy Rice Faro-44,Olam Agri,100,540000,Sagamu Hub,Consolidation Active",
      "",
      "Total_Mandates,Aggregated_Supply_MT,Escrow_Custody_NGN,SON_Scale_Sync",
      `${mandatesCount},986 MT,248500000.00,100% Calibrated`,
    ].join("\n");

    downloadFile(csv, `produce-buyer-sourcing-dossier-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
    showScreenToast("Sourcing Dossier (.csv) exported successfully");
  };

  const handleCreateRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    setMandatesCount((prev) => prev + 1);
    setShowRequirementModal(false);
    showScreenToast(`Created Purchase Requirement for ${reqVolume} MT of ${reqCommodity}`);
  };

  const handleScheduleWeighbridge = (e: React.FormEvent) => {
    e.preventDefault();
    setShowWeighbridgeModal(false);
    showScreenToast(`Weighbridge Slot Scheduled at ${wbTerminal} for ${wbVehicle}`);
  };

  const handleAuthorizeTicket = () => {
    setTicketAuthorized(true);
    showScreenToast("Scale Ticket #WB-2026-0492 Authorized: ₦11,970,000 released via Zenith NIBSS Instant");
  };

  const filteredLots = ALL_LOTS.filter((lot) => {
    const matchesSearch =
      lotSearch === "" ||
      lot.id.toLowerCase().includes(lotSearch.toLowerCase()) ||
      lot.cluster.toLowerCase().includes(lotSearch.toLowerCase()) ||
      lot.commodity.toLowerCase().includes(lotSearch.toLowerCase()) ||
      lot.location.toLowerCase().includes(lotSearch.toLowerCase());

    const matchesStatus =
      lotStatusFilter === "ALL" ||
      lot.statusType === lotStatusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="screen">
      <div className="flex flex-col w-full gap-space-lg">
        <div className="w-full bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
          <div className="flex flex-wrap items-center justify-between gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
                <span>Agricultural Commerce</span>
                <Icon name="chevron_right" className="text-[14px]" />
                <span className="text-primary font-bold">Buyer &amp; Aggregator Hub (§6.4)</span>
                <Icon name="chevron_right" className="text-[14px]" />
                <span className="text-on-surface">South-West Industrial Agro-Corridor</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface tracking-tight">Produce Buyer &amp; Aggregator Command Hub</h1>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-4xl">Enterprise commodity sourcing, smallholder lot consolidation, weighbridge quality verification, and automated escrow contracts across Oyo, Ogun, Osun, and Ondo state networks.</p>
            </div>
            <div className="flex flex-wrap items-center gap-space-sm">
              {_props.slots?.actions ?? (
                <>
                  <button
                    onClick={() => setShowRequirementModal(true)}
                    className="bg-primary text-on-primary px-space-md py-2 rounded-lg font-label-lg text-label-lg flex items-center gap-space-xs hover:bg-primary-container transition-colors shadow-sm"
                    type="button"
                  >
                    <Icon name="add_circle" className="text-[20px]" />
                    <span>Create Purchase Requirement</span>
                  </button>
                  <button
                    onClick={() => setShowWeighbridgeModal(true)}
                    className="bg-surface-container text-on-surface px-space-md py-2 rounded-lg font-label-lg text-label-lg flex items-center gap-space-xs hover:bg-surface-container-high transition-colors"
                    type="button"
                  >
                    <Icon name="scale" className="text-[20px]" />
                    <span>Schedule Weighbridge Slot</span>
                  </button>
                  <button
                    onClick={handleExportDossier}
                    className="bg-surface-container-low text-on-surface-variant px-space-md py-2 rounded-lg font-label-lg text-label-lg flex items-center gap-space-xs hover:bg-surface-container transition-colors"
                    type="button"
                  >
                    <Icon name="ios_share" className="text-[20px]" />
                    <span>Export Sourcing Dossier</span>
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-space-sm pt-space-xs text-on-surface-variant">
            <div className="inline-flex items-center gap-space-xs bg-secondary-fixed text-on-secondary-fixed px-space-sm py-1 rounded-full font-label-sm text-label-sm">
              <Icon name="verified_user" className="text-[16px] text-secondary" />
              <span>Verified Off-taker (Tier 3 CAC &amp; NEPC)</span>
            </div>
            <div className="inline-flex items-center gap-space-xs bg-surface-container px-space-sm py-1 rounded-full font-label-sm text-label-sm text-on-surface">
              <Icon name="route" className="text-[16px] text-primary" />
              <span>Corridors: Oyo (Iseyin, Saki) · Ogun (Abeokuta, Sagamu) · Osun (Ede)</span>
            </div>
            <div className="inline-flex items-center gap-space-xs bg-surface-container-high px-space-sm py-1 rounded-full font-label-sm text-label-sm text-on-surface">
              <Icon name="account_balance" className="text-[16px] text-secondary" />
              <span>Automated Escrow Custody: Zenith Bank PLC</span>
            </div>
            <div className="inline-flex items-center gap-space-xs bg-surface-container-low px-space-sm py-1 rounded-full font-label-sm text-label-sm text-outline">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span>Weighbridge Node Sync: 100% Online</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-space-md w-full">
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-md text-label-md uppercase tracking-wider">Active Mandates</span>
              <Icon name="assignment_turned_in" className="text-[20px] text-primary" />
            </div>
            <div className="my-space-sm">
              <div className="font-metric-num text-metric-num text-on-surface">{mandatesCount} Mandates</div>
              <div className="text-body-sm font-body-sm text-secondary flex items-center gap-1 font-semibold">
                <span>1,450 MT Target</span>
                <span>· 68% Filled</span>
              </div>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: "68%" }} />
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-md text-label-md uppercase tracking-wider">Aggregated Supply</span>
              <Icon name="groups" className="text-[20px] text-secondary" />
            </div>
            <div className="my-space-sm">
              <div className="font-metric-num text-metric-num text-on-surface">986 MT</div>
              <div className="text-body-sm font-body-sm text-on-surface-variant">14 Smallholder Co-ops</div>
            </div>
            <div className="flex items-center gap-space-xs text-label-sm font-label-sm text-secondary">
              <Icon name="check_circle" className="text-[14px]" />
              <span>284 verified farmers</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-md text-label-md uppercase tracking-wider">Escrow Balance</span>
              <Icon name="lock" className="text-[20px] text-tertiary" />
            </div>
            <div className="my-space-sm">
              <div className="font-metric-num text-metric-num text-on-surface">₦248.5M</div>
              <div className="text-body-sm font-body-sm text-outline">₦172.2M Locked in transit</div>
            </div>
            <div className="text-label-sm font-label-sm text-tertiary flex items-center gap-1">
              <span>₦76.3M awaiting QC ticket</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-md text-label-md uppercase tracking-wider">Fleet Inbound</span>
              <Icon name="local_shipping" className="text-[20px] text-primary" />
            </div>
            <div className="my-space-sm">
              <div className="font-metric-num text-metric-num text-on-surface">14 Trucks</div>
              <div className="text-body-sm font-body-sm text-on-surface-variant">8 Transit · 4 Gate · 2 Offload</div>
            </div>
            <div className="flex items-center gap-space-xs text-label-sm font-label-sm text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              <span>Telematics tracking live</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-md text-label-md uppercase tracking-wider">Avg Quality Grade</span>
              <Icon name="verified" className="text-[20px] text-secondary" />
            </div>
            <div className="my-space-sm">
              <div className="font-metric-num text-metric-num text-on-surface">Grade A</div>
              <div className="text-body-sm font-body-sm text-secondary">94.2% Acceptance Rate</div>
            </div>
            <div className="text-label-sm font-label-sm text-on-surface-variant">
              <span>12.8% Maize H₂O · 0.8% Impurities</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-md text-label-md uppercase tracking-wider">SLA Fulfillment</span>
              <Icon name="timer" className="text-[20px] text-primary" />
            </div>
            <div className="my-space-sm">
              <div className="font-metric-num text-metric-num text-on-surface">97.4%</div>
              <div className="text-body-sm font-body-sm text-secondary">0.0% Penalty Default Rate</div>
            </div>
            <div className="text-label-sm font-label-sm text-on-surface-variant">
              <span>10-Day SLA delivery window</span>
            </div>
          </div>
        </div>

        <div className="w-full bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
          <div className="flex flex-wrap items-center justify-between gap-space-sm pb-space-xs">
            <div className="flex items-center gap-space-sm">
              <div className="p-2 rounded-lg bg-primary-container text-on-primary">
                <Icon name="radar" className="text-[22px]" />
              </div>
              <div>
                <h2 className="font-headline-lg text-headline-lg text-on-surface">Active Commodity Purchase Requirements &amp; Sourcing Radar</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Live contract terms, quality specifications, and consolidated farmer lot matching (§6.4)</p>
              </div>
            </div>
            <div className="flex items-center gap-space-xs bg-surface-container p-1 rounded-lg">
              <button
                onClick={() => {
                  setMandateCategory("all");
                  showScreenToast("Viewing all purchase mandates");
                }}
                className={`px-space-sm py-1 rounded font-label-sm text-label-sm transition-colors ${
                  mandateCategory === "all"
                    ? "bg-surface-container-lowest text-primary font-bold shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                type="button"
              >
                All Mandates
              </button>
              <button
                onClick={() => {
                  setMandateCategory("grains");
                  showScreenToast("Filtered: Grains & Cereals (Maize, Rice)");
                }}
                className={`px-space-sm py-1 rounded font-label-sm text-label-sm transition-colors ${
                  mandateCategory === "grains"
                    ? "bg-surface-container-lowest text-primary font-bold shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                type="button"
              >
                Grains &amp; Cereals
              </button>
              <button
                onClick={() => {
                  setMandateCategory("tubers");
                  showScreenToast("Filtered: Tubers & Roots (Cassava, Yam)");
                }}
                className={`px-space-sm py-1 rounded font-label-sm text-label-sm transition-colors ${
                  mandateCategory === "tubers"
                    ? "bg-surface-container-lowest text-primary font-bold shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                type="button"
              >
                Tubers &amp; Roots
              </button>
              <button
                onClick={() => {
                  setMandateCategory("legumes");
                  showScreenToast("Filtered: Legumes & Oilseeds (Soybean)");
                }}
                className={`px-space-sm py-1 rounded font-label-sm text-label-sm transition-colors ${
                  mandateCategory === "legumes"
                    ? "bg-surface-container-lowest text-primary font-bold shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                type="button"
              >
                Legumes &amp; Oilseeds
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md">
            {(mandateCategory === "all" || mandateCategory === "grains") && (
              <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between gap-space-md hover:bg-surface-container transition-all shadow-sm">
                <div className="flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-primary font-bold">#REQ-BUY-2026-01</span>
                    <span className="px-space-sm py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Inbound Lots Matching
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <h3 className="font-headline-md text-headline-md text-on-surface">Yellow Maize (Feed Mill Grade 1)</h3>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">₦420,000 / MT</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Off-taker: <strong className="text-on-surface font-semibold">Grand Cereals / Livestock Feeds PLC</strong> · Destination: Ibadan Central Silos</p>
                </div>
                <div className="grid grid-cols-3 gap-space-sm bg-surface-container-lowest p-space-sm rounded-lg text-center">
                  <div>
                    <div className="font-label-sm text-label-sm text-outline">Target Qty</div>
                    <div className="font-label-lg text-label-lg font-bold text-on-surface">500 MT</div>
                  </div>
                  <div>
                    <div className="font-label-sm text-label-sm text-outline">Collected / %</div>
                    <div className="font-label-lg text-label-lg font-bold text-secondary">390 MT (78%)</div>
                  </div>
                  <div>
                    <div className="font-label-sm text-label-sm text-outline">Max Moisture</div>
                    <div className="font-label-lg text-label-lg font-bold text-on-surface">≤ 13.0%</div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant mb-1">
                    <span>Sourcing Progress</span>
                    <span className="font-bold text-on-surface">390 / 500 MT</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: "78%" }} />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-space-xs text-body-sm font-body-sm">
                  <span className="text-on-surface-variant flex items-center gap-1"><Icon name="calendar_today" className="text-[16px]" /> Delivery Window: 10 May – 25 May 2026</span>
                  <button
                    onClick={() => setShowInspectLotsModal(true)}
                    className="text-secondary font-label-lg text-label-lg font-semibold hover:underline flex items-center gap-0.5"
                    type="button"
                  >
                    <span>Inspect 3 Matched Lots</span>
                    <Icon name="arrow_forward" className="text-[16px]" />
                  </button>
                </div>
              </div>
            )}

            {(mandateCategory === "all" || mandateCategory === "tubers") && (
              <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between gap-space-md hover:bg-surface-container transition-all shadow-sm">
                <div className="flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-primary font-bold">#REQ-BUY-2026-02</span>
                    <span className="px-space-sm py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Daily Harvester Hauls Active
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <h3 className="font-headline-md text-headline-md text-on-surface">Industrial Cassava Roots (Starch Grade)</h3>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">₦115,000 / MT</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Off-taker: <strong className="text-on-surface font-semibold">Psaltry International PLC</strong> · Destination: Ado-Awaye Factory Gate</p>
                </div>
                <div className="grid grid-cols-3 gap-space-sm bg-surface-container-lowest p-space-sm rounded-lg text-center">
                  <div>
                    <div className="font-label-sm text-label-sm text-outline">Target Qty</div>
                    <div className="font-label-lg text-label-lg font-bold text-on-surface">600 MT</div>
                  </div>
                  <div>
                    <div className="font-label-sm text-label-sm text-outline">Collected / %</div>
                    <div className="font-label-lg text-label-lg font-bold text-secondary">440 MT (73.3%)</div>
                  </div>
                  <div>
                    <div className="font-label-sm text-label-sm text-outline">Min Starch Yield</div>
                    <div className="font-label-lg text-label-lg font-bold text-on-surface">≥ 24.0%</div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant mb-1">
                    <span>Sourcing Progress</span>
                    <span className="font-bold text-on-surface">440 / 600 MT</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-secondary h-full rounded-full" style={{ width: "73.3%" }} />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-space-xs text-body-sm font-body-sm">
                  <span className="text-on-surface-variant flex items-center gap-1"><Icon name="schedule" className="text-[16px]" /> Continuous Intake (Max 24h Root Age)</span>
                  <button
                    onClick={() => setShowHarvesterRosterModal(true)}
                    className="text-secondary font-label-lg text-label-lg font-semibold hover:underline flex items-center gap-0.5"
                    type="button"
                  >
                    <span>View Fresh Harvester Roster</span>
                    <Icon name="arrow_forward" className="text-[16px]" />
                  </button>
                </div>
              </div>
            )}

            {(mandateCategory === "all" || mandateCategory === "legumes") && (
              <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between gap-space-md hover:bg-surface-container transition-all shadow-sm">
                <div className="flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-primary font-bold">#REQ-BUY-2026-03</span>
                    <span className="px-space-sm py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> Open Aggregator Bids
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <h3 className="font-headline-md text-headline-md text-on-surface">Non-GMO Soybean (Oil Extraction)</h3>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">₦680,000 / MT</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Off-taker: <strong className="text-on-surface font-semibold">Premium Edible Oils Ede</strong> · Destination: Osun Refining Complex</p>
                </div>
                <div className="grid grid-cols-3 gap-space-sm bg-surface-container-lowest p-space-sm rounded-lg text-center">
                  <div>
                    <div className="font-label-sm text-label-sm text-outline">Target Qty</div>
                    <div className="font-label-lg text-label-lg font-bold text-on-surface">250 MT</div>
                  </div>
                  <div>
                    <div className="font-label-sm text-label-sm text-outline">Collected / %</div>
                    <div className="font-label-lg text-label-lg font-bold text-tertiary">110 MT (44%)</div>
                  </div>
                  <div>
                    <div className="font-label-sm text-label-sm text-outline">Target Oil Index</div>
                    <div className="font-label-lg text-label-lg font-bold text-on-surface">≥ 19.0%</div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant mb-1">
                    <span>Sourcing Progress</span>
                    <span className="font-bold text-on-surface">110 / 250 MT</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-tertiary-container h-full rounded-full" style={{ width: "44%" }} />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-space-xs text-body-sm font-body-sm">
                  <span className="text-on-surface-variant flex items-center gap-1"><Icon name="calendar_today" className="text-[16px]" /> Window: 15 May – 30 May 2026</span>
                  <button
                    onClick={() => setShowBroadcastModal(true)}
                    className="text-secondary font-label-lg text-label-lg font-semibold hover:underline flex items-center gap-0.5"
                    type="button"
                  >
                    <span>Broadcast Aggregator Request</span>
                    <Icon name="arrow_forward" className="text-[16px]" />
                  </button>
                </div>
              </div>
            )}

            {(mandateCategory === "all" || mandateCategory === "grains") && (
              <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between gap-space-md hover:bg-surface-container transition-all shadow-sm">
                <div className="flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-primary font-bold">#REQ-BUY-2026-04</span>
                    <span className="px-space-sm py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Co-op Consolidation Active
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <h3 className="font-headline-md text-headline-md text-on-surface">Paddy Rice (Faro 44 Long Grain)</h3>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">₦540,000 / MT</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Off-taker: <strong className="text-on-surface font-semibold">Olam Agri / Ebonyi Mills Hub</strong> · Destination: Sagamu Hub</p>
                </div>
                <div className="grid grid-cols-3 gap-space-sm bg-surface-container-lowest p-space-sm rounded-lg text-center">
                  <div>
                    <div className="font-label-sm text-label-sm text-outline">Target Qty</div>
                    <div className="font-label-lg text-label-lg font-bold text-on-surface">100 MT</div>
                  </div>
                  <div>
                    <div className="font-label-sm text-label-sm text-outline">Collected / %</div>
                    <div className="font-label-lg text-label-lg font-bold text-secondary">46 MT (46%)</div>
                  </div>
                  <div>
                    <div className="font-label-sm text-label-sm text-outline">Broken Grain Max</div>
                    <div className="font-label-lg text-label-lg font-bold text-on-surface">≤ 4.0%</div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant mb-1">
                    <span>Sourcing Progress</span>
                    <span className="font-bold text-on-surface">46 / 100 MT</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: "46%" }} />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-space-xs text-body-sm font-body-sm">
                  <span className="text-on-surface-variant flex items-center gap-1"><Icon name="calendar_today" className="text-[16px]" /> Window: 01 June – 15 June 2026</span>
                  <button
                    onClick={() => setShowConsolidateRiceModal(true)}
                    className="text-secondary font-label-lg text-label-lg font-semibold hover:underline flex items-center gap-0.5"
                    type="button"
                  >
                    <span>Consolidate Rice Lots</span>
                    <Icon name="arrow_forward" className="text-[16px]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-full bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm">
              <div className="p-2 rounded-lg bg-surface-container text-primary">
                <Icon name="inventory_2" className="text-[22px]" />
              </div>
              <div>
                <h2 className="font-headline-lg text-headline-lg text-on-surface">Smallholder Aggregated Lots &amp; Supply Pipeline</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Traceable farmer cluster consolidation with GPS boundary attestation and tamper-evident bag tags</p>
              </div>
            </div>
            <div className="flex items-center gap-space-sm">
              <div className="flex items-center bg-surface-container-low px-space-md py-1.5 rounded-lg text-on-surface-variant">
                <Icon name="search" className="text-[18px] mr-1 text-outline" />
                <input
                  className="bg-transparent text-body-sm font-body-sm text-on-surface focus:outline-none w-48"
                  placeholder="Filter by Lot ID, Cluster, Farmer..."
                  type="text"
                  value={lotSearch}
                  onChange={(e) => setLotSearch(e.target.value)}
                />
              </div>
              <button
                onClick={() => setShowFilterStatusModal(true)}
                className="bg-surface-container px-space-md py-1.5 rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-1"
                type="button"
              >
                <Icon name="tune" className="text-[16px]" />
                <span>Filter Status {lotStatusFilter !== "ALL" ? `(${lotStatusFilter})` : ""}</span>
              </button>
            </div>
          </div>
          <div className="w-full overflow-x-auto rounded-lg">
            <table className="w-full text-left font-body-sm text-body-sm">
              <thead className="bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                <tr>
                  <th className="py-space-sm px-space-md">Lot Identifier &amp; Origin</th>
                  <th className="py-space-sm px-space-md">Contributing Cluster</th>
                  <th className="py-space-sm px-space-md">Commodity &amp; Spec</th>
                  <th className="py-space-sm px-space-md">Volume</th>
                  <th className="py-space-sm px-space-md">Traceability &amp; Bagging</th>
                  <th className="py-space-sm px-space-md">Quality Telemetry</th>
                  <th className="py-space-sm px-space-md">Status</th>
                  <th className="py-space-sm px-space-md text-right">Operational Action</th>
                </tr>
              </thead>
              <tbody className="divide-y-0 text-on-surface">
                {filteredLots.map((lot) => (
                  <tr key={lot.id} className="bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
                    <td className="py-space-md px-space-md">
                      <div className="font-label-lg text-label-lg font-bold text-primary">{lot.id}</div>
                      <div className="text-on-surface-variant font-body-sm text-body-sm">{lot.location}</div>
                    </td>
                    <td className="py-space-md px-space-md">
                      <div className="font-semibold text-on-surface">{lot.cluster}</div>
                      <div className="text-on-surface-variant text-label-sm font-label-sm">{lot.farmers}</div>
                    </td>
                    <td className="py-space-md px-space-md">
                      <div className="font-medium text-on-surface">{lot.commodity}</div>
                      <div className="text-label-sm font-label-sm text-outline">{lot.spec}</div>
                    </td>
                    <td className="py-space-md px-space-md">
                      <span className="font-bold text-on-surface">{lot.volume}</span>
                      <span className="block text-label-sm font-label-sm text-outline">{lot.bags}</span>
                    </td>
                    <td className="py-space-md px-space-md">
                      <div className="flex items-center gap-1 text-secondary font-label-sm font-semibold">
                        <Icon name="qr_code_2" className="text-[16px]" /> {lot.traceability}
                      </div>
                      <span className="text-label-sm font-label-sm text-on-surface-variant">{lot.traceType}</span>
                    </td>
                    <td className="py-space-md px-space-md">
                      <div className="flex items-center gap-1 font-semibold text-on-surface">
                        <Icon name="water_drop" className="text-[16px] text-secondary" /> {lot.quality}
                      </div>
                      <span className="text-label-sm font-label-sm text-secondary">{lot.qualityNote}</span>
                    </td>
                    <td className="py-space-md px-space-md">
                      <span className="px-space-sm py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> {lot.status}
                      </span>
                    </td>
                    <td className="py-space-md px-space-md text-right">
                      {lot.statusType === "ready" && (
                        <button
                          onClick={() => setDispatchModalLot(lot)}
                          className="bg-primary text-on-primary px-space-sm py-1.5 rounded-lg font-label-sm text-label-sm hover:bg-primary-container transition-colors inline-flex items-center gap-1 shadow-sm"
                          type="button"
                        >
                          <Icon name="local_shipping" className="text-[16px]" /> {lot.actionLabel}
                        </button>
                      )}
                      {lot.statusType === "transit" && (
                        <button
                          onClick={() => setTrackGpsModalLot(lot)}
                          className="bg-surface-container-high text-on-surface px-space-sm py-1.5 rounded-lg font-label-sm text-label-sm hover:bg-surface-container transition-colors inline-flex items-center gap-1"
                          type="button"
                        >
                          <Icon name="my_location" className="text-[16px]" /> {lot.actionLabel}
                        </button>
                      )}
                      {lot.statusType === "passed" && (
                        <button
                          onClick={() => setEscrowModalLot(lot)}
                          className="bg-tertiary text-on-tertiary px-space-sm py-1.5 rounded-lg font-label-sm text-label-sm hover:opacity-90 transition-opacity inline-flex items-center gap-1 shadow-sm"
                          type="button"
                        >
                          <Icon name="payments" className="text-[16px]" /> {lot.actionLabel}
                        </button>
                      )}
                      {lot.statusType === "lab" && (
                        <button
                          onClick={() => setLabCertModalLot(lot)}
                          className="bg-surface-container-high text-on-surface px-space-sm py-1.5 rounded-lg font-label-sm text-label-sm hover:bg-surface-container transition-colors inline-flex items-center gap-1"
                          type="button"
                        >
                          <Icon name="biotech" className="text-[16px]" /> {lot.actionLabel}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between text-on-surface-variant font-body-sm text-body-sm pt-space-xs">
            <div>Showing {filteredLots.length} of 14 Smallholder Aggregate Lots across 4 Corridors</div>
            <div className="flex items-center gap-space-xs">
              <button
                onClick={() => {
                  if (currentPage > 1) {
                    setCurrentPage((p) => p - 1);
                    showScreenToast("Viewing page 1 of lots");
                  }
                }}
                disabled={currentPage === 1}
                className="px-space-sm py-1 rounded bg-surface-container text-on-surface-variant hover:text-on-surface disabled:opacity-40"
                type="button"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(1)}
                className={`px-space-sm py-1 rounded font-bold transition-colors ${
                  currentPage === 1 ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"
                }`}
                type="button"
              >
                1
              </button>
              <button
                onClick={() => {
                  setCurrentPage(2);
                  showScreenToast("Viewing page 2 of lots");
                }}
                className={`px-space-sm py-1 rounded font-bold transition-colors ${
                  currentPage === 2 ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"
                }`}
                type="button"
              >
                2
              </button>
              <button
                onClick={() => {
                  if (currentPage < 2) {
                    setCurrentPage((p) => p + 1);
                    showScreenToast("Viewing page 2 of lots");
                  }
                }}
                disabled={currentPage === 2}
                className="px-space-sm py-1 rounded bg-surface-container text-on-surface-variant hover:text-on-surface disabled:opacity-40"
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-md w-full">
          <div className="xl:col-span-7 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <div className="flex flex-wrap items-center justify-between gap-space-sm pb-space-xs">
                <div className="flex items-center gap-space-sm">
                  <div className="p-2 rounded-lg bg-primary-container text-on-primary">
                    <Icon name="balance" className="text-[22px]" />
                  </div>
                  <div>
                    <h2 className="font-headline-lg text-headline-lg text-on-surface">Digital Weighbridge Ticket &amp; Lab Grading Station</h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Automated axle load scale integration, NIR moisture spectroscopy, and Aflatoxin assay (§11.3)</p>
                  </div>
                </div>
                <span className="px-space-sm py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Scale Calibrated (SON Stamp #2026)
                </span>
              </div>
              <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col gap-space-md shadow-sm">
                <div className="flex flex-wrap items-center justify-between border-b-0">
                  <div>
                    <div className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Active Intake Scale Ticket</div>
                    <div className="font-headline-md text-headline-md text-primary font-bold">#WB-2026-0492</div>
                  </div>
                  <div className="text-right">
                    <div className="font-label-sm text-label-sm text-outline">Terminal</div>
                    <div className="font-label-lg text-label-lg font-semibold text-on-surface">Ibadan Processing Hub Gate #2</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm bg-surface-container-lowest p-space-sm rounded-lg">
                  <div>
                    <span className="font-label-sm text-label-sm text-outline block">Vehicle Reg / Type</span>
                    <span className="font-label-lg text-label-lg font-bold text-on-surface">OYO-442-XA</span>
                    <span className="text-label-sm text-label-sm text-on-surface-variant block">Bedford 30-Tonne Tipper</span>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm text-outline block">Driver / Credentials</span>
                    <span className="font-label-lg text-label-lg font-bold text-on-surface">Lateef Adeleke</span>
                    <span className="text-label-sm text-label-sm text-secondary font-semibold block">NIN Verified (FRSC Match)</span>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm text-outline block">Commodity Batch</span>
                    <span className="font-label-lg text-label-lg font-bold text-on-surface">Yellow Maize (Feed 1)</span>
                    <span className="text-label-sm text-label-sm text-on-surface-variant block">From #LOT-ISY-992</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-space-sm">
                  <div className="bg-surface-container-lowest p-space-sm rounded-lg text-center">
                    <span className="font-label-sm text-label-sm text-outline block">Gross Axle Weight</span>
                    <span className="font-headline-sm text-headline-sm font-bold text-on-surface">42,850 kg</span>
                    <span className="text-label-sm text-label-sm text-on-surface-variant">Arrival: 10:42 AM</span>
                  </div>
                  <div className="bg-surface-container-lowest p-space-sm rounded-lg text-center">
                    <span className="font-label-sm text-label-sm text-outline block">Tare (Tare Truck)</span>
                    <span className="font-headline-sm text-headline-sm font-bold text-on-surface">14,350 kg</span>
                    <span className="text-label-sm text-label-sm text-on-surface-variant">Post-Dump: 11:15 AM</span>
                  </div>
                  <div className="bg-primary-container p-space-sm rounded-lg text-center text-on-primary">
                    <span className="font-label-sm text-label-sm text-primary-fixed block">Certified Net Weight</span>
                    <span className="font-headline-md text-headline-md font-bold text-on-primary">28,500 kg</span>
                    <span className="text-label-sm text-label-sm text-primary-fixed font-bold">28.50 Metric Tonnes</span>
                  </div>
                </div>
                <div>
                  <div className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-2">Automated Quality Laboratory Assay (#QC-NG-2026-8819)</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-space-xs">
                    <div className="bg-surface-container-lowest p-2 rounded-lg">
                      <span className="text-label-sm font-label-sm text-outline block">Moisture (NIR)</span>
                      <span className="font-label-lg font-bold text-secondary">12.7%</span>
                      <span className="text-[11px] text-on-surface-variant block">Max spec ≤13.0% (PASS)</span>
                    </div>
                    <div className="bg-surface-container-lowest p-2 rounded-lg">
                      <span className="text-label-sm font-label-sm text-outline block">Aflatoxin (B1/Total)</span>
                      <span className="font-label-lg font-bold text-secondary">3.2 ppb</span>
                      <span className="text-[11px] text-on-surface-variant block">EU/SON limit ≤10 ppb (PASS)</span>
                    </div>
                    <div className="bg-surface-container-lowest p-2 rounded-lg">
                      <span className="text-label-sm font-label-sm text-outline block">Foreign Matter</span>
                      <span className="font-label-lg font-bold text-secondary">0.7%</span>
                      <span className="text-[11px] text-on-surface-variant block">Tolerable ≤1.5% (PASS)</span>
                    </div>
                    <div className="bg-surface-container-lowest p-2 rounded-lg">
                      <span className="text-label-sm font-label-sm text-outline block">Broken Kernels</span>
                      <span className="font-label-lg font-bold text-secondary">2.1%</span>
                      <span className="text-[11px] text-on-surface-variant block">Spec limit ≤4.0% (PASS)</span>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-container-high rounded-xl p-space-md flex flex-wrap items-center justify-between gap-space-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-headline-sm text-headline-sm font-bold text-on-surface">Grade A Certified</span>
                      <span className="px-2 py-0.5 rounded bg-secondary text-on-secondary font-label-sm text-label-sm font-bold">100% Value Release</span>
                    </div>
                    <div className="text-body-sm font-body-sm text-on-surface-variant mt-0.5">Calculated Value: 28.5 MT × ₦420,000 = <strong className="text-on-surface font-semibold">₦11,970,000.00</strong> (Zero Quality Deductions)</div>
                  </div>
                  <button
                    onClick={handleAuthorizeTicket}
                    disabled={ticketAuthorized}
                    className="bg-primary text-on-primary px-space-lg py-2.5 rounded-lg font-label-lg text-label-lg font-bold flex items-center gap-space-xs hover:bg-primary-container transition-all shadow-md disabled:opacity-60"
                    type="button"
                  >
                    <Icon name="check_circle" className="text-[20px]" />
                    <span>{ticketAuthorized ? "Escrow Released (₦11.97M)" : "Authorize Ticket & Release Escrow"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="xl:col-span-5 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between pb-space-xs">
                <div className="flex items-center gap-space-sm">
                  <div className="p-2 rounded-lg bg-surface-container text-primary">
                    <Icon name="navigation" className="text-[22px]" />
                  </div>
                  <div>
                    <h2 className="font-headline-lg text-headline-lg text-on-surface">Inbound Logistics Radar</h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Live telemetry, route progress, and cargo environment (§6.5)</p>
                  </div>
                </div>
                <Icon name="sensors" className="text-secondary animate-pulse text-[20px]" />
              </div>
              <div className="w-full h-44 rounded-xl bg-cover bg-center relative overflow-hidden shadow-sm flex flex-col justify-between p-space-sm text-on-primary" data-location="Iseyin, Nigeria" style={{ backgroundImage: "url('/images/screens/0146c285bb45.webp')" }}>
                <div className="flex items-center justify-between bg-inverse-surface/80 px-2 py-1 rounded text-inverse-on-surface font-label-sm text-label-sm w-fit">
                  <span className="w-2 h-2 rounded-full bg-secondary-fixed mr-1.5 animate-ping" />
                  <span>Oyo-Ibadan Expressway Corridor Telemetry</span>
                </div>
                <div className="flex items-center justify-between bg-surface-container-lowest/95 backdrop-blur-md p-space-xs rounded-lg text-on-surface font-label-sm text-label-sm shadow-md">
                  <div className="flex items-center gap-1">
                    <Icon name="speed" className="text-secondary text-[16px]" />
                    <span>Avg Speed: 54 km/h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon name="thermostat" className="text-primary text-[16px]" />
                    <span>Cargo Temp: 28°C</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon name="water_drop" className="text-secondary text-[16px]" />
                    <span>Humidity: 62% RH</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-space-xs mt-space-xs">
                <div className="bg-surface-container-low rounded-lg p-space-sm flex flex-col gap-1 hover:bg-surface-container transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">#TRK-09 (Freight #FRT-9921)</span>
                      <span className="px-1.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm">In-Transit</span>
                    </div>
                    <span className="font-label-sm text-label-sm font-bold text-secondary">ETA: 1h 15m</span>
                  </div>
                  <div className="text-body-sm font-body-sm text-on-surface-variant flex items-center justify-between">
                    <span>Saki Northern Depot → Ibadan Silos (142 km)</span>
                    <span className="text-on-surface font-medium">30 MT Maize</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden mt-1">
                    <div className="bg-primary h-full rounded-full" style={{ width: "72%" }} />
                  </div>
                </div>
                <div className="bg-surface-container-low rounded-lg p-space-sm flex flex-col gap-1 hover:bg-surface-container transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">#TRK-14 (Freight #FRT-9924)</span>
                      <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm">At Factory Gate</span>
                    </div>
                    <span className="font-label-sm text-label-sm font-bold text-primary">Weighing Queue (#2)</span>
                  </div>
                  <div className="text-body-sm font-body-sm text-on-surface-variant flex items-center justify-between">
                    <span>Iseyin Farm Gate → Psaltry Ado-Awaye (38 km)</span>
                    <span className="text-on-surface font-medium">25 MT Fresh Cassava</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden mt-1">
                    <div className="bg-secondary h-full rounded-full" style={{ width: "95%" }} />
                  </div>
                </div>
                <div className="bg-surface-container-low rounded-lg p-space-sm flex flex-col gap-1 hover:bg-surface-container transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">#TRK-03 (Freight #FRT-9918)</span>
                      <span className="px-1.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm">In-Transit</span>
                    </div>
                    <span className="font-label-sm text-label-sm font-bold text-secondary">ETA: 2h 40m</span>
                  </div>
                  <div className="text-body-sm font-body-sm text-on-surface-variant flex items-center justify-between">
                    <span>Ede Farm Hub → Sagamu Silos (185 km)</span>
                    <span className="text-on-surface font-medium">28 MT Soybeans</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden mt-1">
                    <div className="bg-primary h-full rounded-full" style={{ width: "48%" }} />
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowFleetMapModal(true)}
              className="w-full bg-surface-container text-on-surface py-2 rounded-lg font-label-lg text-label-lg font-semibold hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1"
              type="button"
            >
              <Icon name="share_location" className="text-[18px]" />
              <span>Open Fleet Command Map (14 Units)</span>
            </button>
          </div>
        </div>

        <div className="w-full bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-wrap items-center justify-between gap-space-md text-on-surface-variant font-body-sm text-body-sm">
          <div className="flex flex-wrap items-center gap-space-lg">
            <div className="flex items-center gap-space-xs">
              <Icon name="shield_with_heart" className="text-secondary text-[20px]" />
              <div>
                <span className="font-label-sm text-label-sm font-bold text-on-surface block">SON MANCAP &amp; NEPC Registered</span>
                <span className="text-label-sm text-label-sm text-outline">Industrial Food Grade Traceability</span>
              </div>
            </div>
            <div className="flex items-center gap-space-xs">
              <Icon name="account_balance" className="text-primary text-[20px]" />
              <div>
                <span className="font-label-sm text-label-sm font-bold text-on-surface block">Zenith Escrow Guarantee §6.4</span>
                <span className="text-label-sm text-label-sm text-outline">₦248,500,000.00 Total Custody Balance</span>
              </div>
            </div>
            <div className="flex items-center gap-space-xs">
              <Icon name="lock_clock" className="text-secondary text-[20px]" />
              <div>
                <span className="font-label-sm text-label-sm font-bold text-on-surface block">SHA-256 Tamper-Proof Audit</span>
                <span className="text-label-sm text-label-sm text-outline">NDPA 2023 Compliant Settlement Ledger</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-space-sm text-label-sm font-label-sm">
            <div className="flex items-center gap-1 text-secondary">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span>Termii SMS Webhook Online</span>
            </div>
            <span className="text-outline">·</span>
            <div className="flex items-center gap-1 text-primary">
              <span className="w-2 h-2 rounded-full bg-primary-fixed-dim" />
              <span>PowerSync Edge DB: Synced</span>
            </div>
          </div>
        </div>

        {/* Purchase Requirement Modal */}
        {showRequirementModal && (
          <ScreenDialog
            title="Create Purchase Requirement (§6.4)"
            subtitle="Broadcast forward contract specs to smallholder cooperatives"
            onClose={() => setShowRequirementModal(false)}
            panel={
              <form onSubmit={handleCreateRequirement} className="flex flex-col gap-space-md">
                <div className="flex flex-col gap-1">
                  <label className="text-label-sm font-semibold text-on-surface">Target Commodity</label>
                  <select
                    value={reqCommodity}
                    onChange={(e) => setReqCommodity(e.target.value)}
                    className="w-full px-space-sm py-2 rounded-lg border border-outline bg-surface-container-low text-on-surface text-body-sm focus:border-primary focus:outline-none"
                  >
                    <option value="Yellow Feed Maize (SAMMAZ-52)">Yellow Feed Maize (SAMMAZ-52)</option>
                    <option value="Industrial Wet Cassava (TME-419)">Industrial Wet Cassava (TME-419)</option>
                    <option value="Non-GMO Soybean (TGX-1448-2E)">Non-GMO Soybean (TGX-1448-2E)</option>
                    <option value="Paddy Rice (Faro 44 Long Grain)">Paddy Rice (Faro 44 Long Grain)</option>
                    <option value="White Maize (Industrial Grits)">White Maize (Industrial Grits)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-space-sm">
                  <div className="flex flex-col gap-1">
                    <label className="text-label-sm font-semibold text-on-surface">Volume Target (MT)</label>
                    <input
                      type="number"
                      required
                      value={reqVolume}
                      onChange={(e) => setReqVolume(e.target.value)}
                      className="w-full px-space-sm py-2 rounded-lg border border-outline bg-surface-container-low text-on-surface text-body-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-label-sm font-semibold text-on-surface">Offer Price / MT (₦)</label>
                    <input
                      type="number"
                      required
                      value={reqPrice}
                      onChange={(e) => setReqPrice(e.target.value)}
                      className="w-full px-space-sm py-2 rounded-lg border border-outline bg-surface-container-low text-on-surface text-body-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-space-sm">
                  <div className="flex flex-col gap-1">
                    <label className="text-label-sm font-semibold text-on-surface">Off-taker Entity</label>
                    <input
                      type="text"
                      required
                      value={reqOfftaker}
                      onChange={(e) => setReqOfftaker(e.target.value)}
                      className="w-full px-space-sm py-2 rounded-lg border border-outline bg-surface-container-low text-on-surface text-body-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-label-sm font-semibold text-on-surface">Sourcing Corridor</label>
                    <input
                      type="text"
                      required
                      value={reqCorridor}
                      onChange={(e) => setReqCorridor(e.target.value)}
                      className="w-full px-space-sm py-2 rounded-lg border border-outline bg-surface-container-low text-on-surface text-body-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-space-sm pt-space-xs border-t border-outline-variant">
                  <ScreenDialogClose onClick={() => setShowRequirementModal(false)}>
                    Cancel
                  </ScreenDialogClose>
                  <button
                    type="submit"
                    className="px-space-md py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold transition-colors"
                  >
                    Publish Requirement
                  </button>
                </div>
              </form>
            }
          />
        )}

        {/* Schedule Weighbridge Modal */}
        {showWeighbridgeModal && (
          <ScreenDialog
            title="Schedule Certified Weighbridge Slot"
            subtitle="Automated axle scale appointment with NIR assay check"
            onClose={() => setShowWeighbridgeModal(false)}
            panel={
              <form onSubmit={handleScheduleWeighbridge} className="flex flex-col gap-space-md">
                <div className="flex flex-col gap-1">
                  <label className="text-label-sm font-semibold text-on-surface">Weighbridge Terminal</label>
                  <select
                    value={wbTerminal}
                    onChange={(e) => setWbTerminal(e.target.value)}
                    className="w-full px-space-sm py-2 rounded-lg border border-outline bg-surface-container-low text-on-surface text-body-sm focus:border-primary focus:outline-none"
                  >
                    <option value="Ibadan Processing Hub Gate #2">Ibadan Processing Hub Gate #2</option>
                    <option value="Abeokuta Psaltry Starch Intake">Abeokuta Psaltry Starch Intake Gate</option>
                    <option value="Sagamu Agro-Industrial Terminal">Sagamu Agro-Industrial Terminal Gate #1</option>
                    <option value="Saki North Grain Consolidation Scale">Saki North Grain Consolidation Scale</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-space-sm">
                  <div className="flex flex-col gap-1">
                    <label className="text-label-sm font-semibold text-on-surface">Truck Registration</label>
                    <input
                      type="text"
                      required
                      value={wbVehicle}
                      onChange={(e) => setWbVehicle(e.target.value)}
                      placeholder="e.g. OYO-442-XA"
                      className="w-full px-space-sm py-2 rounded-lg border border-outline bg-surface-container-low text-on-surface text-body-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-label-sm font-semibold text-on-surface">Driver Name</label>
                    <input
                      type="text"
                      required
                      value={wbDriver}
                      onChange={(e) => setWbDriver(e.target.value)}
                      placeholder="Full Name"
                      className="w-full px-space-sm py-2 rounded-lg border border-outline bg-surface-container-low text-on-surface text-body-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-label-sm font-semibold text-on-surface">Arrival Slot</label>
                  <input
                    type="datetime-local"
                    required
                    value={wbSlot}
                    onChange={(e) => setWbSlot(e.target.value)}
                    className="w-full px-space-sm py-2 rounded-lg border border-outline bg-surface-container-low text-on-surface text-body-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-space-sm pt-space-xs border-t border-outline-variant">
                  <ScreenDialogClose onClick={() => setShowWeighbridgeModal(false)}>
                    Cancel
                  </ScreenDialogClose>
                  <button
                    type="submit"
                    className="px-space-md py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold transition-colors"
                  >
                    Confirm Weighbridge Slot
                  </button>
                </div>
              </form>
            }
          />
        )}

        {/* Fleet Command Map Modal */}
        {showFleetMapModal && (
          <ScreenDialog
            title="Fleet Command Radar (14 Active Haulage Units)"
            subtitle="Google Maps GPS telematics and axle sensor stream"
            onClose={() => setShowFleetMapModal(false)}
            panel={
              <div className="space-y-space-sm text-body-sm">
                <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
                    <div>
                      <span className="font-semibold text-on-surface block">#TRK-09 (Freight #FRT-9921)</span>
                      <span className="text-on-surface-variant text-label-sm">Saki Northern Depot → Ibadan Silos (142 km)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-secondary font-bold font-label-sm block">ETA: 1h 15m</span>
                    <span className="text-outline text-label-sm">30 MT Maize</span>
                  </div>
                </div>
                <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <div>
                      <span className="font-semibold text-on-surface block">#TRK-14 (Freight #FRT-9924)</span>
                      <span className="text-on-surface-variant text-label-sm">Iseyin Farm Gate → Psaltry Ado-Awaye (38 km)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-primary font-bold font-label-sm block">Gate Queue #2</span>
                    <span className="text-outline text-label-sm">25 MT Fresh Cassava</span>
                  </div>
                </div>
                <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
                    <div>
                      <span className="font-semibold text-on-surface block">#TRK-03 (Freight #FRT-9918)</span>
                      <span className="text-on-surface-variant text-label-sm">Ede Farm Hub → Sagamu Silos (185 km)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-secondary font-bold font-label-sm block">ETA: 2h 40m</span>
                    <span className="text-outline text-label-sm">28 MT Soybeans</span>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-space-sm pt-space-xs border-t border-outline-variant">
                  <ScreenDialogClose onClick={() => setShowFleetMapModal(false)}>
                    Close Radar
                  </ScreenDialogClose>
                </div>
              </div>
            }
          />
        )}

        {/* MODAL 1: Inspect 3 Matched Lots */}
        {showInspectLotsModal && (
          <ScreenDialog
            title="Matched Inbound Lots: #REQ-BUY-2026-01 (Yellow Maize)"
            subtitle="3 smallholder clusters meeting Grand Cereals ≤13.0% moisture specification"
            onClose={() => setShowInspectLotsModal(false)}
            panel={
              <div className="space-y-3">
                {[
                  { id: "#LOT-ISY-992", coop: "Iseyin Savanna Syndicate", vol: "85.0 MT", h2o: "12.6%", price: "₦35,700,000" },
                  { id: "#LOT-SAK-804", coop: "Saki West Maize Farmers Union", vol: "160.0 MT", h2o: "12.8%", price: "₦67,200,000" },
                  { id: "#LOT-OOR-221", coop: "Oorelope Grain Cluster", vol: "145.0 MT", h2o: "12.4%", price: "₦60,900,000" },
                ].map((lot) => (
                  <div key={lot.id} className="p-3 rounded-lg bg-surface-container-low flex justify-between items-center text-sm">
                    <div>
                      <div className="font-bold text-primary">{lot.id} · {lot.coop}</div>
                      <div className="text-xs text-on-surface-variant">Volume: {lot.vol} · Moisture: {lot.h2o}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-on-surface">{lot.price}</div>
                      <span className="text-xs text-secondary font-bold">Ready to Haul</span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end pt-2">
                  <ScreenDialogClose onClick={() => setShowInspectLotsModal(false)}>
                    Close
                  </ScreenDialogClose>
                </div>
              </div>
            }
          />
        )}

        {/* MODAL 2: Fresh Harvester Roster */}
        {showHarvesterRosterModal && (
          <ScreenDialog
            title="Fresh Harvester Roster: Psaltry Ado-Awaye"
            subtitle="Live tracking of 24h root age to maximize factory starch extraction yield"
            onClose={() => setShowHarvesterRosterModal(false)}
            panel={
              <div className="space-y-3 text-sm">
                <div className="p-3 rounded-lg bg-surface-container-low space-y-1">
                  <div className="font-bold text-on-surface">Tipper Unit #14 (OYO-891-BD)</div>
                  <div className="text-xs text-on-surface-variant">Driver: Ganiyu Akande · 25 MT TME-419 · Harvested: 4h ago (Saki East)</div>
                  <span className="text-xs font-semibold text-secondary">En Route to Factory Gate (Arrives 14:30)</span>
                </div>
                <div className="p-3 rounded-lg bg-surface-container-low space-y-1">
                  <div className="font-bold text-on-surface">Tipper Unit #22 (OGN-221-AK)</div>
                  <div className="text-xs text-on-surface-variant">Driver: Mukaila Bello · 30 MT TME-419 · Harvested: 6h ago (Abeokuta North)</div>
                  <span className="text-xs font-semibold text-secondary">At Factory Scale Queue #1</span>
                </div>
                <div className="flex justify-end pt-2">
                  <ScreenDialogClose onClick={() => setShowHarvesterRosterModal(false)}>
                    Close
                  </ScreenDialogClose>
                </div>
              </div>
            }
          />
        )}

        {/* MODAL 3: Broadcast Aggregator Request */}
        {showBroadcastModal && (
          <ScreenDialog
            title="Broadcast Non-GMO Soybean Request"
            subtitle="Dispatch RFQ to 48 certified aggregators across Osun and Oyo states"
            onClose={() => setShowBroadcastModal(false)}
            panel={
              <div className="space-y-3 text-sm">
                <p className="text-on-surface-variant text-xs">
                  A high-priority procurement SMS and WhatsApp advisory will be dispatched via Termii to 48 licensed oilseed aggregators for <strong>250 MT @ ₦680,000 / MT</strong>.
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <ScreenDialogClose onClick={() => setShowBroadcastModal(false)}>
                    Cancel
                  </ScreenDialogClose>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBroadcastModal(false);
                      showScreenToast("Dispatched procurement advisory to 48 registered soybean aggregators.");
                    }}
                    className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold text-xs hover:bg-primary-container"
                  >
                    Send Broadcast via Termii
                  </button>
                </div>
              </div>
            }
          />
        )}

        {/* MODAL 4: Consolidate Rice Lots */}
        {showConsolidateRiceModal && (
          <ScreenDialog
            title="Consolidate Smallholder Rice Lots"
            subtitle="Merge 4 cluster deliveries into single 100 MT freight consignment for Olam Agri"
            onClose={() => setShowConsolidateRiceModal(false)}
            panel={
              <div className="space-y-3 text-sm">
                <div className="p-3 rounded-lg bg-surface-container-low space-y-1">
                  <div className="font-semibold text-on-surface">Current Staged Volume: 46.0 MT / 100.0 MT</div>
                  <div className="text-xs text-on-surface-variant">Egba Rice Growers (38 MT) + Sagamu Outgrowers (8 MT)</div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mt-1">
                    <div className="bg-primary h-full rounded-full" style={{ width: "46%" }} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <ScreenDialogClose onClick={() => setShowConsolidateRiceModal(false)}>
                    Close
                  </ScreenDialogClose>
                  <button
                    type="button"
                    onClick={() => {
                      setShowConsolidateRiceModal(false);
                      showScreenToast("Consolidation batch locked: #CONS-RIC-2026-09 ready for freight dispatch.");
                    }}
                    className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold text-xs hover:bg-primary-container"
                  >
                    Lock Consolidation Batch
                  </button>
                </div>
              </div>
            }
          />
        )}

        {/* MODAL 5: Filter Status Modal */}
        {showFilterStatusModal && (
          <ScreenDialog
            title="Filter Smallholder Supply Lots"
            subtitle="Filter supply table by operational workflow stage"
            onClose={() => setShowFilterStatusModal(false)}
            panel={
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {[
                    { id: "ALL", label: "All Operational Stages" },
                    { id: "ready", label: "Ready for Haulage" },
                    { id: "transit", label: "Truck En Route" },
                    { id: "passed", label: "Quality Passed" },
                    { id: "lab", label: "Lab Inspection" },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        setLotStatusFilter(st.id);
                        setShowFilterStatusModal(false);
                        showScreenToast(`Filtering lots by: ${st.label}`);
                      }}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        lotStatusFilter === st.id
                          ? "border-primary bg-primary/10 text-primary font-bold"
                          : "border-outline/20 bg-surface-container-low hover:bg-surface-container"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
                <div className="flex justify-end pt-2">
                  <ScreenDialogClose onClick={() => setShowFilterStatusModal(false)}>
                    Close
                  </ScreenDialogClose>
                </div>
              </div>
            }
          />
        )}

        {/* MODAL 6: Dispatch Logistics Modal */}
        {dispatchModalLot && (
          <ScreenDialog
            title={`Dispatch Logistics: ${dispatchModalLot.id}`}
            subtitle={dispatchModalLot.cluster}
            onClose={() => setDispatchModalLot(null)}
            panel={
              <div className="space-y-3 text-sm">
                <div className="p-3 rounded-lg bg-surface-container-low space-y-1">
                  <div><strong>Origin:</strong> {dispatchModalLot.location}</div>
                  <div><strong>Cargo:</strong> {dispatchModalLot.volume} ({dispatchModalLot.commodity})</div>
                  <div><strong>Destination:</strong> Grand Cereals Ibadan Processing Silos</div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <ScreenDialogClose onClick={() => setDispatchModalLot(null)}>
                    Cancel
                  </ScreenDialogClose>
                  <button
                    type="button"
                    onClick={() => {
                      setDispatchModalLot(null);
                      showScreenToast(`Freight haulage dispatched for ${dispatchModalLot.id} with BedFord 30T Truck.`);
                    }}
                    className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold text-xs hover:bg-primary-container"
                  >
                    Confirm Freight Dispatch
                  </button>
                </div>
              </div>
            }
          />
        )}

        {/* MODAL 7: Track Hauler GPS Modal */}
        {trackGpsModalLot && (
          <ScreenDialog
            title={`Real-Time Telematics: ${trackGpsModalLot.id}`}
            subtitle={trackGpsModalLot.location}
            onClose={() => setTrackGpsModalLot(null)}
            panel={
              <div className="space-y-3 text-sm">
                <div className="p-3 rounded-lg bg-surface-container-low space-y-2">
                  <div><strong>Vehicle:</strong> Tipper #TRK-14 (OYO-442-XA)</div>
                  <div><strong>Driver:</strong> Lateef Adeleke (NIN Verified)</div>
                  <div><strong>Google Maps Coordinates:</strong> 8.6701° N, 3.3910° E (Iseyin-Ado Expressway)</div>
                  <div><strong>Speed / Telemetry:</strong> 52 km/h · Cargo Temp 27.5°C</div>
                </div>
                <div className="flex justify-end pt-2">
                  <ScreenDialogClose onClick={() => setTrackGpsModalLot(null)}>
                    Close
                  </ScreenDialogClose>
                </div>
              </div>
            }
          />
        )}

        {/* MODAL 8: Escrow Release Modal */}
        {escrowModalLot && (
          <ScreenDialog
            title={`Authorize Escrow Release: ${escrowModalLot.id}`}
            subtitle={escrowModalLot.cluster}
            onClose={() => setEscrowModalLot(null)}
            panel={
              <div className="space-y-3 text-sm">
                <div className="p-3 rounded-lg bg-surface-container-low space-y-2">
                  <div><strong>Gross Sum:</strong> ₦30,600,000.00 (45.0 MT Soybean @ ₦680,000)</div>
                  <div><strong>Beneficiary:</strong> Oke-Ogun Soya Alliance Union Escrow Sub-Account</div>
                  <div><strong>Settlement Rail:</strong> Zenith Bank NIBSS Instant Payout</div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <ScreenDialogClose onClick={() => setEscrowModalLot(null)}>
                    Cancel
                  </ScreenDialogClose>
                  <button
                    type="button"
                    onClick={() => {
                      setEscrowModalLot(null);
                      showScreenToast(`Released ₦30,600,000.00 escrow to ${escrowModalLot.cluster} via NIBSS.`);
                    }}
                    className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold text-xs hover:bg-primary-container"
                  >
                    Authorize ₦30.6M Payout
                  </button>
                </div>
              </div>
            }
          />
        )}

        {/* MODAL 9: Upload Lab Cert Modal */}
        {labCertModalLot && (
          <ScreenDialog
            title={`Upload Quality Lab Assay: ${labCertModalLot.id}`}
            subtitle={labCertModalLot.cluster}
            onClose={() => setLabCertModalLot(null)}
            panel={
              <div className="space-y-3 text-sm">
                <div className="p-3 rounded-lg bg-surface-container-low space-y-2">
                  <div><strong>Commodity:</strong> {labCertModalLot.commodity}</div>
                  <div><strong>Batch Volume:</strong> {labCertModalLot.volume}</div>
                  <div className="text-xs text-on-surface-variant">Attach verified moisture, impurity, and aflatoxin report from NAFDAC / SON certified lab.</div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <ScreenDialogClose onClick={() => setLabCertModalLot(null)}>
                    Cancel
                  </ScreenDialogClose>
                  <button
                    type="button"
                    onClick={() => {
                      setLabCertModalLot(null);
                      showScreenToast(`Uploaded Lab Assay for ${labCertModalLot.id}. Status changed to Quality Passed.`);
                    }}
                    className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold text-xs hover:bg-primary-container"
                  >
                    Submit Lab Certification
                  </button>
                </div>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
