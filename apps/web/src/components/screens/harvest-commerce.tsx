"use client";

// Ported from the "produce_harvest_commerce_hub" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { useState } from "react";
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogClose, showScreenToast } from "@/components/ds/screen-dialog";
import { downloadFile } from "@/lib/download";
import type { ScreenProps } from "./types";

interface HarvestLot {
  id: string;
  category: "grains" | "vegetables" | "tubers" | "fish";
  code: string;
  parcel: string;
  title: string;
  image: string;
  imageAlt: string;
  askingPrice: string;
  priceUnit: string;
  availableVol: string;
  metric1Label: string;
  metric1Val: string;
  metric2Label: string;
  metric2Val: string;
  metric3Label: string;
  metric3Val: string;
  pickupWindow: string;
  labNote: string;
  badge: string;
  status: "available" | "bids_active" | "contracted" | "dispatched";
}

const INITIAL_LOTS: HarvestLot[] = [
  {
    id: "lot-1",
    category: "grains",
    code: "HV-2026-081",
    parcel: "Plot A1 & A2",
    title: "Yellow Maize (DMR-LSR-Y)",
    image: "/images/screens/4a8b9fc9b3d2.webp",
    imageAlt: "Golden ripe maize corn cobs harvested in sacks under sunlight at Iseyin farm in Oyo State with laboratory quality tag attached",
    askingPrice: "₦420,000",
    priceUnit: "/ MT",
    availableVol: "48.0 MT",
    metric1Label: "Moisture Level",
    metric1Val: "12.5% (Certified)",
    metric2Label: "Aflatoxin Spec",
    metric2Val: "<4 ppb (Grade A)",
    metric3Label: "Target Pickup",
    metric3Val: "May 28, 2026",
    pickupWindow: "May 28, 2026",
    labNote: "Tested by IITA-Certified Field Lab #04",
    badge: "2 Active Bids",
    status: "bids_active",
  },
  {
    id: "lot-2",
    category: "vegetables",
    code: "HV-2026-094",
    parcel: "Plot B1 Lowland",
    title: "Tomato Roma VF (Table Grade)",
    image: "/images/screens/a9404bc26417.webp",
    imageAlt: "Crates of firm freshly harvested deep red Roma tomatoes stacked inside an evaporative cooling shelter in Oyo State",
    askingPrice: "₦18,500",
    priceUnit: "/ Crate",
    availableVol: "180 Crates (~9 MT)",
    metric1Label: "Brix Sugar Index",
    metric1Val: "4.8° Brix",
    metric2Label: "Firmness Rating",
    metric2Val: "8.4 N (High Transit)",
    metric3Label: "Committed Off-taker",
    metric3Val: "Mile 12 Consortium",
    pickupWindow: "Tomorrow 06:00 WAT",
    labNote: "Staggered 3-day pick window • Cold chain dispatch pre-booked",
    badge: "Pickup Tomorrow 06:00 WAT",
    status: "contracted",
  },
  {
    id: "lot-3",
    category: "tubers",
    code: "HV-2026-062",
    parcel: "Plot B2 Plateau",
    title: "High-Starch Cassava Roots (TME 419)",
    image: "/images/screens/5b71fcf185e8.webp",
    imageAlt: "Healthy freshly dug high-starch cassava roots piled in an agricultural yard ready for industrial starch processing in Oyo State",
    askingPrice: "₦95,000",
    priceUnit: "/ MT",
    availableVol: "110.0 MT",
    metric1Label: "Starch Dry Matter",
    metric1Val: "24.2% Content",
    metric2Label: "Factory Destination",
    metric2Val: "Psaltry (Ado-Awaye)",
    metric3Label: "Delivery Window",
    metric3Val: "June 15 - 20",
    pickupWindow: "June 15 - 20",
    labNote: "Escrow Locked: ₦10,450,000 with Zenith Bank Commercial Trust",
    badge: "Factory Delivery Forward",
    status: "contracted",
  },
  {
    id: "lot-4",
    category: "fish",
    code: "HV-2026-018",
    parcel: "Pond P2 Growout",
    title: "African Sharptooth Catfish (Clarias)",
    image: "/images/screens/2b60dbf31abb.webp",
    imageAlt: "Plump African sharptooth catfish swimming in an earthen aquaculture growout pond during grading in Ibadan Nigeria",
    askingPrice: "₦2,650",
    priceUnit: "/ kg live",
    availableVol: "1.15 MT",
    metric1Label: "Average Size",
    metric1Val: "950g – 1.2kg",
    metric2Label: "Processing Mode",
    metric2Val: "Live Aerated / Smoked",
    metric3Label: "Target Market",
    metric3Val: "Ibadan & Abeokuta Grills",
    pickupWindow: "Ready for Seining",
    labNote: "Pure borehole water cycle • Zero chemical medication withdrawal period",
    badge: "Ready for Seining",
    status: "available",
  },
];

export function HarvestCommerce(_props: ScreenProps) {
  const [lots, setLots] = useState<HarvestLot[]>(INITIAL_LOTS);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [grandCerealsBidStatus, setGrandCerealsBidStatus] = useState<"pending" | "countered" | "accepted">("pending");
  const [foodCoBidStatus, setFoodCoBidStatus] = useState<"pending" | "accepted" | "declined">("pending");

  // New lot form state
  const [newCropName, setNewCropName] = useState("");
  const [newParcel, setNewParcel] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newMoisture, setNewMoisture] = useState("");
  const [newFarmgate, setNewFarmgate] = useState("");
  const [newPickupDate, setNewPickupDate] = useState("2026-06-01");

  // Counter offer state
  const [counterRate, setCounterRate] = useState("425000");
  const [counterTerms, setCounterTerms] = useState("Buyer covers haulage + 48h weighbridge settlement");

  const filteredLots = lots.filter((lot) => {
    if (selectedCategory === "all") return true;
    return lot.category === selectedCategory;
  });

  const handlePublishLot = () => {
    if (!newCropName || !newParcel || !newQuantity) {
      showScreenToast("Please provide commodity name, parcel, and available volume.");
      return;
    }

    const newId = `lot-${Date.now()}`;
    const newLotCode = `HV-2026-${Math.floor(100 + Math.random() * 900)}`;

    const createdLot: HarvestLot = {
      id: newId,
      category: newCropName.toLowerCase().includes("maize") || newCropName.toLowerCase().includes("grain")
        ? "grains"
        : newCropName.toLowerCase().includes("tomato") || newCropName.toLowerCase().includes("pepper")
        ? "vegetables"
        : newCropName.toLowerCase().includes("cassava") || newCropName.toLowerCase().includes("yam")
        ? "tubers"
        : "grains",
      code: newLotCode,
      parcel: newParcel,
      title: newCropName,
      image: "/images/screens/4a8b9fc9b3d2.webp",
      imageAlt: `Harvest lot ${newCropName} listed at ${newParcel}`,
      askingPrice: newFarmgate.startsWith("₦") ? newFarmgate : `₦${newFarmgate || "400,000"}`,
      priceUnit: "/ MT",
      availableVol: newQuantity.includes("MT") || newQuantity.includes("Crate") ? newQuantity : `${newQuantity} MT`,
      metric1Label: "Certified Quality",
      metric1Val: newMoisture || "12.0% Certified",
      metric2Label: "Agronomy Sign-off",
      metric2Val: "IITA Verified",
      metric3Label: "Target Pickup",
      metric3Val: newPickupDate,
      pickupWindow: newPickupDate,
      labNote: "Automatic off-taker syndicated alert dispatched to 14 corporate buyers.",
      badge: "Newly Listed",
      status: "available",
    };

    setLots([createdLot, ...lots]);
    setNewCropName("");
    setNewParcel("");
    setNewQuantity("");
    setNewMoisture("");
    setNewFarmgate("");

    showScreenToast(`Harvest Lot ${newLotCode} published. Syndicated alert dispatched to 14 verified off-takers.`);
  };

  const handleExportWaybills = () => {
    const csvContent =
      "Waybill ID,Lot Code,Commodity,Parcel,Volume (MT),Asking Rate (NGN),Escrow Status,Destination,Quality Metric,Cert Stamp\n" +
      lots
        .map(
          (l) =>
            `WB-${l.code.replace("HV-", "")},${l.code},"${l.title}","${l.parcel}","${l.availableVol}","${l.askingPrice} ${l.priceUnit}",${
              l.status === "contracted" ? "ESCROW_LOCKED" : "QUOTA_OPEN"
            },"${l.metric2Val}","${l.metric1Val}",0x${Math.random().toString(16).substring(2, 10)}`
        )
        .join("\n");

    downloadFile("cultivanode-harvest-waybill-manifest-2026.csv", csvContent, "text/csv");
    showScreenToast("Produce Waybill manifest exported to CSV.");
  };

  const panelNewLotModal = (
    <div className="w-full max-w-xl rounded-xl bg-surface-container-lowest shadow-2xl overflow-hidden flex flex-col">
      <div className="p-space-md bg-surface-container-lowest flex items-center justify-between border-b border-surface-container">
        <div className="flex items-center gap-2">
          <Icon name="post_add" className="text-primary text-xl" />
          <h3 className="font-headline-md text-headline-md text-on-surface">List New Harvest Lot</h3>
        </div>
        <ScreenDialogClose>
          <button onClick={() => {}} className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface" id="close-lot-modal" type="button">
            <Icon name="close" className="text-lg" />
          </button>
        </ScreenDialogClose>
      </div>
      <div className="p-space-lg flex flex-col gap-space-md bg-surface overflow-y-auto max-h-[819px]">
        <div>
          <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">Crop or Commodity Name</label>
          <input
            className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm shadow-sm focus:outline-none border border-surface-container"
            placeholder="e.g. DMR-LSR-Y Yellow Maize, Roma Tomatoes"
            type="text"
            value={newCropName}
            onChange={(e) => setNewCropName(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-space-sm">
          <div>
            <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">Harvest Parcel / Field</label>
            <input
              className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm shadow-sm focus:outline-none border border-surface-container"
              placeholder="Plot A1, B2 Plateau"
              type="text"
              value={newParcel}
              onChange={(e) => setNewParcel(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">Available Quantity</label>
            <input
              className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm shadow-sm focus:outline-none border border-surface-container"
              placeholder="e.g. 25.0 MT or 150 Crates"
              type="text"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-space-sm">
          <div>
            <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">Certified Moisture / Brix</label>
            <input
              className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm shadow-sm focus:outline-none border border-surface-container"
              placeholder="e.g. 12.2% or 4.9° Brix"
              type="text"
              value={newMoisture}
              onChange={(e) => setNewMoisture(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">Asking Farmgate (₦)</label>
            <input
              className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm shadow-sm focus:outline-none border border-surface-container"
              placeholder="₦ per MT or per Crate"
              type="text"
              value={newFarmgate}
              onChange={(e) => setNewFarmgate(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">Target Pickup Window</label>
          <input
            className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm shadow-sm focus:outline-none border border-surface-container"
            type="date"
            value={newPickupDate}
            onChange={(e) => setNewPickupDate(e.target.value)}
          />
        </div>
        <div className="p-3 rounded-lg bg-secondary-container/20 text-on-secondary-container font-label-sm text-label-sm flex items-center gap-2">
          <Icon name="verified" className="text-base" />
          <span>Automatic off-taker syndicated alert will dispatch to 14 verified corporate buyers upon publication.</span>
        </div>
      </div>
      <div className="p-space-md bg-surface-container-lowest flex items-center justify-end gap-space-sm border-t border-surface-container">
        <ScreenDialogClose>
          <button onClick={() => {}} className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-high transition-colors" id="cancel-lot-btn" type="button">
            Cancel
          </button>
        </ScreenDialogClose>
        <ScreenDialogClose>
          <button
            className="px-5 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container transition-colors shadow-sm"
            id="save-lot-btn"
            type="button"
            onClick={handlePublishLot}
          >
            Publish to Off-taker Hub
          </button>
        </ScreenDialogClose>
      </div>
    </div>
  );

  const panelReviewContractsModal = (
    <div className="w-full max-w-2xl rounded-xl bg-surface-container-lowest shadow-2xl overflow-hidden flex flex-col">
      <div className="p-space-md bg-surface-container-lowest flex items-center justify-between border-b border-surface-container">
        <div className="flex items-center gap-2">
          <Icon name="assignment_turned_in" className="text-secondary text-xl" />
          <h3 className="font-headline-md text-headline-md text-on-surface">Active Corporate Off-taker Contracts (3)</h3>
        </div>
        <ScreenDialogClose>
          <button onClick={() => {}} className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface" type="button">
            <Icon name="close" className="text-lg" />
          </button>
        </ScreenDialogClose>
      </div>
      <div className="p-space-lg flex flex-col gap-space-md bg-surface overflow-y-auto max-h-[70vh]">
        <div className="p-3.5 rounded-lg bg-surface-container-lowest shadow-sm flex flex-col gap-2 border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md font-bold text-on-surface">Contract #CTR-GC-2026-04 · Grand Cereals Ltd</span>
            <span className="px-2 py-0.5 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold">₦16,600,000 Escrow Active</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">40 MT Yellow Maize (DMR) @ ₦415,000/MT delivered to Jos/Ibadan feed mills. Zenith Bank commercial guarantee active.</p>
          <div className="flex items-center justify-between pt-1">
            <span className="font-label-sm text-label-sm text-secondary font-medium">Weighbridge Tolerance: ±1.5%</span>
            <button
              className="text-primary font-label-sm text-label-sm font-semibold hover:underline flex items-center gap-1"
              type="button"
              onClick={() => {
                downloadFile(
                  "Grand-Cereals-Contract-CTR-GC-2026-04.txt",
                  "CULTIVANODE B2B OFF-TAKE AGREEMENT\nContract ID: CTR-GC-2026-04\nBuyer: Grand Cereals Ltd\nProducer Cluster: Iseyin Maize Producers\nVolume: 40.0 MT Yellow Maize\nPrice: ₦415,000 / MT (Total: ₦16,600,000)\nEscrow Holder: Zenith Bank PLC\nDispute Jurisdiction: Oyo State High Court Arbitration Hub",
                  "text/plain"
                );
                showScreenToast("Contract CTR-GC-2026-04 downloaded.");
              }}
            >
              <Icon name="download" className="text-sm" />
              <span>Download Contract</span>
            </button>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-surface-container-lowest shadow-sm flex flex-col gap-2 border-l-4 border-secondary">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md font-bold text-on-surface">Contract #CTR-PS-2026-48 · Psaltry International PLC</span>
            <span className="px-2 py-0.5 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold">₦10,450,000 Escrow Locked</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">110 MT High-Starch Cassava (TME 419) @ ₦95,000/MT for Ado-Awaye processing plant. Delivery June 15-20.</p>
          <div className="flex items-center justify-between pt-1">
            <span className="font-label-sm text-label-sm text-secondary font-medium">Starch Dry Matter: ≥24.0%</span>
            <button
              className="text-primary font-label-sm text-label-sm font-semibold hover:underline flex items-center gap-1"
              type="button"
              onClick={() => {
                downloadFile(
                  "Psaltry-Contract-CTR-PS-2026-48.txt",
                  "CULTIVANODE B2B INDUSTRIAL OFF-TAKE AGREEMENT\nContract ID: CTR-PS-2026-48\nBuyer: Psaltry International PLC (Ado-Awaye Starch Factory)\nProducer: Saki Plateau Cassava Cluster\nVolume: 110.0 MT\nPrice: ₦95,000 / MT (Total: ₦10,450,000)\nQuality Spec: Minimum 24% starch dry matter content\nEscrow: Zenith Commercial Trust Segregated NUBAN",
                  "text/plain"
                );
                showScreenToast("Contract CTR-PS-2026-48 downloaded.");
              }}
            >
              <Icon name="download" className="text-sm" />
              <span>Download Contract</span>
            </button>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-surface-container-lowest shadow-sm flex flex-col gap-2 border-l-4 border-tertiary">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md font-bold text-on-surface">Contract #CTR-M12-2026-19 · Mile 12 Consortium</span>
            <span className="px-2 py-0.5 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold">₦3,330,000 In-Transit</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">180 Crates Roma VF Tomatoes @ ₦18,500/Crate. Chilled logistics pre-booked departing tomorrow morning.</p>
          <div className="flex items-center justify-between pt-1">
            <span className="font-label-sm text-label-sm text-secondary font-medium">Chilled Route: +12°C Monitored</span>
            <button
              className="text-primary font-label-sm text-label-sm font-semibold hover:underline flex items-center gap-1"
              type="button"
              onClick={() => {
                downloadFile(
                  "Mile12-Consortium-Contract-CTR-M12-2026-19.txt",
                  "CULTIVANODE PERISHABLE HORTICULTURE FORWARD CONTRACT\nContract ID: CTR-M12-2026-19\nBuyer: Mile 12 Traders Consortium Lagos\nCommodity: 180 Crates Roma VF Tomato (Grade A Table Fresh)\nDelivered Value: ₦3,330,000\nLogistics Carrier: Oke-Ogun Agro-Logistics 5-Tonne Reefer\nTemperature Requirement: +10°C to +14°C continuous datalogger",
                  "text/plain"
                );
                showScreenToast("Contract CTR-M12-2026-19 downloaded.");
              }}
            >
              <Icon name="download" className="text-sm" />
              <span>Download Contract</span>
            </button>
          </div>
        </div>
      </div>
      <div className="p-space-md bg-surface-container-lowest flex items-center justify-end border-t border-surface-container">
        <ScreenDialogClose>
          <button onClick={() => {}} className="px-5 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container transition-colors" type="button">
            Done Reviewing
          </button>
        </ScreenDialogClose>
      </div>
    </div>
  );

  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <div className="px-space-md lg:px-space-xl py-space-lg flex flex-col gap-space-md">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md">
            <div className="flex flex-col min-w-0 max-w-3xl">
              <div className="flex flex-wrap items-center gap-space-xs mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" /> PILOT 0% PLATFORM COMMISSION POLICY ACTIVE
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-medium">
                  <Icon name="verified" className="text-[14px] text-secondary" /> Verified Direct Settlements
                </span>
              </div>
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight">Produce Commerce &amp; Off-taker Hub</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">B2B harvest off-take agreements, certified grading, cold-chain logistics, and farmgate forward contracts for Oyo State agro-clusters.</p>
            </div>
            <div className="flex flex-wrap items-center gap-space-sm shrink-0">
              {_props.slots?.actions ?? (
                <>
                  <ScreenDialog title="List New Harvest Lot" side="center" panel={panelNewLotModal}>
                    <button onClick={() => {}} className="inline-flex items-center gap-2 px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg font-semibold hover:bg-primary-container transition-all shadow-md hover:shadow-lg" id="open-lot-modal" type="button">
                      <Icon name="add_circle" className="text-lg" />
                      <span>List New Harvest Lot</span>
                    </button>
                  </ScreenDialog>
                  <ScreenDialog title="Review Off-taker Contracts" side="center" panel={panelReviewContractsModal}>
                    <button onClick={() => {}} className="relative inline-flex items-center gap-2 px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-lg text-label-lg font-semibold shadow-sm hover:bg-surface-container-low transition-all" type="button">
                      <Icon name="assignment_turned_in" className="text-lg text-secondary" />
                      <span>Review Off-taker Contracts</span>
                      <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full bg-secondary text-on-secondary font-label-sm text-label-sm font-bold">3</span>
                    </button>
                  </ScreenDialog>
                  <button
                    className="inline-flex items-center gap-2 px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-lg text-label-lg font-semibold shadow-sm hover:bg-surface-container-low transition-all"
                    type="button"
                    onClick={handleExportWaybills}
                  >
                    <Icon name="download" className="text-lg text-on-surface-variant" />
                    <span>Export Waybill (CSV)</span>
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md mt-2">
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Available &amp; Forecast Produce</span>
                <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center">
                  <Icon name="grain" className="text-primary text-xl" />
                </div>
              </div>
              <div className="my-space-sm">
                <div className="flex items-baseline gap-2">
                  <span className="font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg text-primary font-bold tracking-tight">186.5</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface-variant">MT</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm mt-1">
                  <Icon name="local_shipping" className="text-[13px] text-secondary" />
                  <span>+24 MT ready for pickup • 4 commodities</span>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Maize, Tomato Roma, Cassava Tubers, Smoked Catfish</p>
            </div>
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Forward Contracts Value</span>
                <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center">
                  <Icon name="handshake" className="text-secondary text-xl" />
                </div>
              </div>
              <div className="my-space-sm">
                <div className="flex items-baseline gap-1">
                  <span className="font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg text-on-surface font-bold tracking-tight">₦14,850,000</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm mt-1">
                  <Icon name="domain" className="text-[13px] text-primary" />
                  <span>3 contracted corporate off-takers</span>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Grand Cereals, Mile 12 Hub, Psaltry Int&apos;l</p>
            </div>
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Avg Farmgate Settlement</span>
                <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center">
                  <Icon name="trending_up" className="text-primary text-xl" />
                </div>
              </div>
              <div className="my-space-sm">
                <div className="flex items-baseline gap-1">
                  <span className="font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg text-on-surface font-bold tracking-tight">₦385,000</span>
                  <span className="font-body-md text-body-md text-on-surface-variant">/ MT avg</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold mt-1">
                  <Icon name="arrow_upward" className="text-[14px]" />
                  <span>+14.2% vs. local spot open market</span>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Direct aggregation bypasses middle-tier broker cut</p>
            </div>
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Fulfillment &amp; Quality Score</span>
                <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center">
                  <Icon name="verified_user" className="text-secondary text-xl" />
                </div>
              </div>
              <div className="my-space-sm">
                <div className="flex items-baseline gap-2">
                  <span className="font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg text-secondary font-bold tracking-tight">99.1%</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Grade A</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm mt-1">
                  <Icon name="check_circle" className="text-[13px] text-secondary" />
                  <span>Zero rejected deliveries to date</span>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Oyo State Certified Agronomist testing pipeline</p>
            </div>
          </div>
        </div>

        <div className="px-space-md lg:px-space-xl pb-space-xl grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          <div className="lg:col-span-8 flex flex-col gap-space-lg">
            <div className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden flex flex-col">
              <div className="p-space-lg bg-surface-container-lowest flex flex-col sm:flex-row sm:items-center justify-between gap-space-md border-b border-surface-container">
                <div>
                  <div className="flex items-center gap-2">
                    <Icon name="inventory_2" className="text-primary text-xl" />
                    <h2 className="font-headline-md text-headline-md text-on-surface">Available Harvest Lots &amp; Quality Certifications</h2>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Aggregated field parcels with laboratory moisture, aflatoxin &amp; Brix metrics</p>
                </div>
                <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg shrink-0 overflow-x-auto" id="commodity-filters">
                  {[
                    { key: "all", label: "All" },
                    { key: "grains", label: "Grains" },
                    { key: "vegetables", label: "Vegetables" },
                    { key: "tubers", label: "Tubers" },
                    { key: "fish", label: "Aquaculture" },
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      className={`px-3 py-1 rounded font-label-sm text-label-sm font-semibold transition-colors ${
                        selectedCategory === cat.key
                          ? "bg-surface-container-lowest text-primary shadow-sm"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                      data-category={cat.key}
                      type="button"
                      onClick={() => setSelectedCategory(cat.key)}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-space-md flex flex-col gap-space-md bg-surface">
                {_props.slots?.lots ??
                  filteredLots.map((lot) => {
                    const panelLabSheet = (
                      <div className="w-full max-w-lg rounded-xl bg-surface-container-lowest shadow-2xl p-space-md flex flex-col gap-3">
                        <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                          <div className="flex items-center gap-2">
                            <Icon name="biotech" className="text-primary text-xl" />
                            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Laboratory Quality Certificate</h3>
                          </div>
                          <ScreenDialogClose>
                            <button onClick={() => {}} className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface" type="button">
                              <Icon name="close" className="text-lg" />
                            </button>
                          </ScreenDialogClose>
                        </div>
                        <div className="p-3 rounded-lg bg-surface-container-low space-y-2 text-body-sm">
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">Lot Identifier:</span>
                            <span className="font-bold text-on-surface">{lot.code}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">Commodity:</span>
                            <span className="font-semibold text-on-surface">{lot.title}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">Certified Testing Station:</span>
                            <span className="font-medium text-primary">IITA-Certified Field Lab #04, Ibadan</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">{lot.metric1Label}:</span>
                            <span className="font-bold text-secondary">{lot.metric1Val}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">{lot.metric2Label}:</span>
                            <span className="font-bold text-secondary">{lot.metric2Val}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">Aflatoxin B1 / Foreign Matter:</span>
                            <span className="font-semibold text-secondary">&lt; 3.8 ppb • 0.5% (Grade A Premium)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">Digital Cryptographic Seal:</span>
                            <span className="font-mono text-xs text-outline">SHA256: 4b91...77ae</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button
                            className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container transition-colors"
                            type="button"
                            onClick={() => {
                              downloadFile(
                                `Lab-Certificate-${lot.code}.txt`,
                                `IITA CERTIFIED QUALITY ANALYSIS SHEET\nLot Code: ${lot.code}\nCommodity: ${lot.title}\nParcel: ${lot.parcel}\nPrimary Spec: ${lot.metric1Label} = ${lot.metric1Val}\nSecondary Spec: ${lot.metric2Label} = ${lot.metric2Val}\nAnalyst: Dr. Quadri Olapade (Chief Agronomist)\nAccreditation: ISO/IEC 17025 Certified Agricultural Assay`,
                                "text/plain"
                              );
                              showScreenToast(`Lab Certificate ${lot.code} downloaded.`);
                            }}
                          >
                            Download Certificate (PDF)
                          </button>
                        </div>
                      </div>
                    );

                    const panelBids = (
                      <div className="w-full max-w-lg rounded-xl bg-surface-container-lowest shadow-2xl p-space-md flex flex-col gap-3">
                        <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                          <div className="flex items-center gap-2">
                            <Icon name="gavel" className="text-primary text-xl" />
                            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Active Off-taker Bids for {lot.code}</h3>
                          </div>
                          <ScreenDialogClose>
                            <button onClick={() => {}} className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface" type="button">
                              <Icon name="close" className="text-lg" />
                            </button>
                          </ScreenDialogClose>
                        </div>
                        <div className="space-y-3">
                          <div className="p-3 rounded-lg bg-surface-container-low space-y-1.5 border border-surface-container">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-on-surface">Grand Cereals Ltd (Jos Mill)</span>
                              <span className="px-2 py-0.5 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold">₦415,000 / MT</span>
                            </div>
                            <p className="text-xs text-on-surface-variant">Volume: 40 MT • Haulage provided by buyer • Settlement within 24h of weighbridge.</p>
                            <div className="flex justify-end gap-2 pt-1">
                              <ScreenDialogClose>
                                <button
                                  className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container"
                                  type="button"
                                  onClick={() => {
                                    setLots(lots.map((l) => (l.id === lot.id ? { ...l, status: "contracted", badge: "Contract Locked" } : l)));
                                    showScreenToast("Bid accepted! 40 MT quota committed into Grand Cereals contract escrow.");
                                  }}
                                >
                                  Accept Bid
                                </button>
                              </ScreenDialogClose>
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-surface-container-low space-y-1.5 border border-surface-container">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-on-surface">Animal Care Feeds (Ogere)</span>
                              <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">₦410,000 / MT</span>
                            </div>
                            <p className="text-xs text-on-surface-variant">Volume: 25 MT • Farmer arranges local transit • Instant dock payment.</p>
                            <div className="flex justify-end gap-2 pt-1">
                              <ScreenDialogClose>
                                <button
                                  className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container"
                                  type="button"
                                  onClick={() => {
                                    setLots(lots.map((l) => (l.id === lot.id ? { ...l, status: "contracted", badge: "Contract Locked" } : l)));
                                    showScreenToast("Bid accepted! 25 MT quota committed to Animal Care Feeds.");
                                  }}
                                >
                                  Accept Bid
                                </button>
                              </ScreenDialogClose>
                            </div>
                          </div>
                        </div>
                      </div>
                    );

                    return (
                      <div key={lot.id} className="lot-card p-space-md rounded-lg bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-space-md" data-category={lot.category}>
                        <div className="w-full md:w-44 h-36 rounded-lg overflow-hidden shrink-0 relative bg-surface-container-high">
                          <img className="w-full h-full object-cover" data-alt={lot.imageAlt} src={lot.image} alt="" loading="lazy" decoding="async" />
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-primary text-on-primary font-label-sm text-label-sm font-bold">{lot.code}</span>
                          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-surface-container-lowest/90 backdrop-blur font-label-sm text-label-sm text-on-surface font-semibold">{lot.parcel}</span>
                        </div>
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">{lot.title}</h3>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container/30 text-on-secondary-container font-label-sm text-label-sm font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> {lot.badge}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="font-label-sm text-label-sm text-on-surface-variant block">Asking Farmgate</span>
                                <span className="font-headline-sm text-headline-sm text-primary font-bold">
                                  {lot.askingPrice} <span className="font-body-sm text-body-sm font-normal text-on-surface-variant">{lot.priceUnit}</span>
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 p-2.5 rounded-lg bg-surface-container-low">
                              <div>
                                <span className="font-label-sm text-label-sm text-on-surface-variant block">Available Lot</span>
                                <span className="font-label-lg text-label-lg font-bold text-on-surface">{lot.availableVol}</span>
                              </div>
                              <div>
                                <span className="font-label-sm text-label-sm text-on-surface-variant block">{lot.metric1Label}</span>
                                <span className="font-label-lg text-label-lg font-bold text-secondary">{lot.metric1Val}</span>
                              </div>
                              <div>
                                <span className="font-label-sm text-label-sm text-on-surface-variant block">{lot.metric2Label}</span>
                                <span className="font-label-lg text-label-lg font-bold text-secondary">{lot.metric2Val}</span>
                              </div>
                              <div>
                                <span className="font-label-sm text-label-sm text-on-surface-variant block">{lot.metric3Label}</span>
                                <span className="font-label-lg text-label-lg font-bold text-on-surface">{lot.metric3Val}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2">
                            <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                              <Icon name="verified" className="text-sm text-secondary" />
                              <span>{lot.labNote}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ScreenDialog title={`Lab Quality Sheet - ${lot.code}`} side="center" panel={panelLabSheet}>
                                <button onClick={() => {}} className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors" type="button">
                                  View Lab Sheet
                                </button>
                              </ScreenDialog>
                              {lot.status === "bids_active" ? (
                                <ScreenDialog title={`Bids for ${lot.code}`} side="center" panel={panelBids}>
                                  <button onClick={() => {}} className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary-container transition-colors shadow-sm" type="button">
                                    Review Bids &amp; Accept (2)
                                  </button>
                                </ScreenDialog>
                              ) : lot.status === "contracted" && lot.category === "vegetables" ? (
                                <button
                                  className="px-3 py-1.5 rounded-lg bg-secondary text-on-secondary font-label-sm text-label-sm font-semibold hover:opacity-90 transition-opacity"
                                  type="button"
                                  onClick={() => {
                                    showScreenToast("Cold-chain dispatch confirmed! Driver Sunday Adeyemi alerted for 06:00 WAT pickup.");
                                  }}
                                >
                                  Confirm Dispatch Call
                                </button>
                              ) : lot.status === "contracted" && lot.category === "tubers" ? (
                                <button
                                  className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary-container transition-colors"
                                  type="button"
                                  onClick={() => {
                                    downloadFile(
                                      `Agreement-PS-48-${lot.code}.txt`,
                                      "PSALTRY FACTORY FORWARD CONTRACT #PS-48\nCommodity: TME 419 Cassava Roots\nVolume: 110 MT\nDestination: Psaltry Factory Ado-Awaye\nEscrow: Zenith Commercial Trust ₦10,450,000\nPre-tare weighbridge booking registered.",
                                      "text/plain"
                                    );
                                    showScreenToast("Agreement #PS-48 downloaded.");
                                  }}
                                >
                                  View Agreement #PS-48
                                </button>
                              ) : (
                                <button
                                  className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary-container transition-colors"
                                  type="button"
                                  onClick={() => {
                                    showScreenToast(`Direct Bidding opened for ${lot.title}. Real-time B2B quotes active.`);
                                  }}
                                >
                                  Open Direct Bidding
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden flex flex-col">
              <div className="p-space-lg flex items-center justify-between bg-surface-container-lowest border-b border-surface-container">
                <div className="flex items-center gap-2">
                  <Icon name="gavel" className="text-secondary text-xl" />
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface">Live Off-taker Bids &amp; Direct Settlement Queue</h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Direct corporate procurement offers pending farmer approval or negotiation</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" /> 2 Actionable Offers
                </span>
              </div>
              <div className="p-space-md grid grid-cols-1 md:grid-cols-2 gap-space-md bg-surface">
                {/* Grand Cereals Bid */}
                <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary font-headline-sm text-headline-sm font-bold">GC</div>
                        <div>
                          <h3 className="font-headline-sm text-headline-sm text-on-surface">Grand Cereals Ltd</h3>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Jos &amp; Ibadan Feed Mill Plants</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold">Tier-1 Corporate</span>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-container-low mb-3 space-y-1.5">
                      <div className="flex justify-between text-body-sm font-body-sm">
                        <span className="text-on-surface-variant">Target Commodity:</span>
                        <span className="font-semibold text-on-surface">Yellow Maize DMR (40.0 MT)</span>
                      </div>
                      <div className="flex justify-between text-body-sm font-body-sm">
                        <span className="text-on-surface-variant">Offered Rate:</span>
                        <span className="font-bold text-primary">₦415,000 / MT</span>
                      </div>
                      <div className="flex justify-between text-body-sm font-body-sm">
                        <span className="text-on-surface-variant">Total Deal Value:</span>
                        <span className="font-headline-sm text-headline-sm font-bold text-on-surface">₦16,600,000</span>
                      </div>
                      <div className="flex justify-between text-body-sm font-body-sm">
                        <span className="text-on-surface-variant">Haulage Terms:</span>
                        <span className="font-medium text-secondary">Buyer supplies 30-MT articulated truck</span>
                      </div>
                      <div className="flex justify-between text-body-sm font-body-sm">
                        <span className="text-on-surface-variant">Payment Guarantee:</span>
                        <span className="text-on-surface">Direct Bank Transfer within 24h of Weighbridge</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm mb-4">
                      <Icon name="timer" className="text-[16px] text-tertiary" />
                      <span>Bid validity expires in <strong>14 hours 20 mins</strong></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    {grandCerealsBidStatus === "accepted" ? (
                      <div className="w-full py-2 px-3 rounded-lg bg-secondary-container text-on-secondary-container font-label-md text-label-md font-bold text-center">
                        Quota Locked (₦16.6M Escrow Secured)
                      </div>
                    ) : (
                      <>
                        <ScreenDialog
                          title="Counter-Offer to Grand Cereals Ltd"
                          side="center"
                          panel={
                            <div className="w-full max-w-md rounded-xl bg-surface-container-lowest p-space-md flex flex-col gap-3">
                              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Submit Counter-Offer</h3>
                              <p className="text-body-sm text-on-surface-variant">Original offer: ₦415,000/MT for 40.0 MT Yellow Maize.</p>
                              <div>
                                <label className="block text-xs font-semibold text-on-surface mb-1">Your Counter Rate (₦ / MT)</label>
                                <input
                                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-sm"
                                  value={counterRate}
                                  onChange={(e) => setCounterRate(e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-on-surface mb-1">Proposed Terms &amp; Logistics</label>
                                <textarea
                                  className="w-full p-2.5 rounded-lg bg-surface-container-low text-on-surface font-body-sm"
                                  rows={2}
                                  value={counterTerms}
                                  onChange={(e) => setCounterTerms(e.target.value)}
                                />
                              </div>
                              <div className="flex justify-end gap-2 pt-2">
                                <ScreenDialogClose>
                                  <button
                                    className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold"
                                    type="button"
                                    onClick={() => {
                                      setGrandCerealsBidStatus("countered");
                                      showScreenToast(`Counter-offer submitted to Grand Cereals at ₦${Number(counterRate).toLocaleString()} / MT.`);
                                    }}
                                  >
                                    Transmit Counter-Offer
                                  </button>
                                </ScreenDialogClose>
                              </div>
                            </div>
                          }
                        >
                          <button onClick={() => {}} className="flex-1 py-2 px-3 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-high transition-colors text-center" type="button">
                            {grandCerealsBidStatus === "countered" ? "Countered (Pending GC)" : "Counter-Offer"}
                          </button>
                        </ScreenDialog>
                        <button
                          className="flex-1 py-2 px-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container transition-colors shadow-sm text-center"
                          type="button"
                          onClick={() => {
                            setGrandCerealsBidStatus("accepted");
                            showScreenToast("Grand Cereals offer accepted! ₦16,600,000 segregated escrow quota locked.");
                          }}
                        >
                          Accept &amp; Lock Quota
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* FoodCo Bid */}
                <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary font-headline-sm text-headline-sm font-bold">FC</div>
                        <div>
                          <h3 className="font-headline-sm text-headline-sm text-on-surface">FoodCo Supermarkets</h3>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Ibadan Retail Central Distribution</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold">Fresh Retail</span>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-container-low mb-3 space-y-1.5">
                      <div className="flex justify-between text-body-sm font-body-sm">
                        <span className="text-on-surface-variant">Target Commodity:</span>
                        <span className="font-semibold text-on-surface">Tomato Roma VF (50 Crates)</span>
                      </div>
                      <div className="flex justify-between text-body-sm font-body-sm">
                        <span className="text-on-surface-variant">Offered Rate:</span>
                        <span className="font-bold text-secondary">₦19,000 / Crate delivered</span>
                      </div>
                      <div className="flex justify-between text-body-sm font-body-sm">
                        <span className="text-on-surface-variant">Total Deal Value:</span>
                        <span className="font-headline-sm text-headline-sm font-bold text-on-surface">₦950,000</span>
                      </div>
                      <div className="flex justify-between text-body-sm font-body-sm">
                        <span className="text-on-surface-variant">Quality Requirement:</span>
                        <span className="font-medium text-primary">Strict Grade A Unblemished Table Fresh</span>
                      </div>
                      <div className="flex justify-between text-body-sm font-body-sm">
                        <span className="text-on-surface-variant">Payment Terms:</span>
                        <span className="text-on-surface">Instant settlement on refrigerated dock arrival</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm mb-4">
                      <Icon name="local_shipping" className="text-[16px] text-secondary" />
                      <span>Requires chilled delivery into Ring Road Hub by 09:00</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    {foodCoBidStatus === "accepted" ? (
                      <div className="w-full py-2 px-3 rounded-lg bg-secondary-container text-on-secondary-container font-label-md text-label-md font-bold text-center">
                        Accepted (50 Crates Commenced)
                      </div>
                    ) : foodCoBidStatus === "declined" ? (
                      <div className="w-full py-2 px-3 rounded-lg bg-surface-container text-on-surface-variant font-label-md text-label-md text-center">
                        Offer Declined
                      </div>
                    ) : (
                      <>
                        <button
                          className="flex-1 py-2 px-3 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-high transition-colors text-center"
                          type="button"
                          onClick={() => {
                            setFoodCoBidStatus("declined");
                            showScreenToast("FoodCo procurement offer declined.");
                          }}
                        >
                          Decline
                        </button>
                        <button
                          className="flex-1 py-2 px-3 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-semibold hover:opacity-90 transition-opacity shadow-sm text-center"
                          type="button"
                          onClick={() => {
                            setFoodCoBidStatus("accepted");
                            showScreenToast("FoodCo offer accepted! 50 Crates booked for chilled Ring Road dispatch.");
                          }}
                        >
                          Accept 50 Crates
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-space-lg">
            <div className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden flex flex-col">
              <div className="p-space-md bg-surface-container-lowest flex items-center justify-between border-b border-surface-container">
                <div className="flex items-center gap-2">
                  <Icon name="commute" className="text-primary text-xl" />
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Logistics &amp; Cold-Chain Dispatch</h2>
                </div>
                <span className="font-label-sm text-label-sm text-secondary font-semibold">Active Fleet: 2</span>
              </div>
              <div className="p-space-md bg-surface flex flex-col gap-space-md">
                <div className="p-3 rounded-lg bg-surface-container-low flex items-center justify-between">
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant block">Haulage Syndicate</span>
                    <span className="font-label-md text-label-md font-bold text-on-surface">Oke-Ogun Agro-Logistics Consortium</span>
                  </div>
                  <Icon name="handshake" className="text-primary text-xl" />
                </div>
                <div className="p-3.5 rounded-lg bg-surface-container-lowest shadow-sm flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-surface-variant flex items-center justify-center">
                        <Icon name="ac_unit" className="text-secondary text-lg" />
                      </div>
                      <div>
                        <h4 className="font-label-md text-label-md font-bold text-on-surface">5-Tonne Chilled Box Truck</h4>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Lagos Fresh Route • Tomato Dispatch</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-bold">+12°C STABLE</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between font-label-sm text-label-sm">
                      <span className="text-on-surface-variant">Driver: Sunday Adeyemi</span>
                      <button
                        className="text-primary font-semibold hover:underline"
                        type="button"
                        onClick={() => {
                          showScreenToast("Calling driver Sunday Adeyemi (+234 802 334 1199) via masked PBX proxy...");
                        }}
                      >
                        +234 802 334 1199
                      </button>
                    </div>
                    <div className="flex justify-between font-label-sm text-label-sm">
                      <span className="text-on-surface-variant">Status: Pre-cooling dock check</span>
                      <span className="text-secondary font-bold">Departure 06:00 WAT</span>
                    </div>
                  </div>
                  <div className="w-full h-32 rounded-lg bg-cover bg-center relative overflow-hidden mt-1" data-location="Iseyin, Oyo State, Nigeria" style={{ backgroundImage: "url('/images/screens/29ca1d80ef33.webp')" }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-inverse-on-surface">
                      <div className="flex items-center gap-1 font-label-sm text-label-sm">
                        <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-ping" />
                        <span className="truncate">Iseyin Aggregation Hub Depot #02</span>
                      </div>
                      <span className="font-label-sm text-label-sm bg-inverse-surface px-1.5 py-0.5 rounded text-white">GPS LIVE</span>
                    </div>
                  </div>
                </div>
                <div className="p-3.5 rounded-lg bg-surface-container-lowest shadow-sm flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center">
                        <Icon name="local_shipping" className="text-primary text-lg" />
                      </div>
                      <div>
                        <h4 className="font-label-md text-label-md font-bold text-on-surface">DAF 30-Tonne Bulk Tipper</h4>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Plate: OYO-482-BD • Cassava Run</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">Standby</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Mobilized for Psaltry Ado-Awaye Factory delivery schedule (June 15). Weighbridge pre-tare registered.</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden flex flex-col">
              <div className="p-space-md bg-surface-container-lowest flex items-center justify-between border-b border-surface-container">
                <div className="flex items-center gap-2">
                  <Icon name="scale" className="text-primary text-xl" />
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Proof of Delivery &amp; Ledger</h2>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Digital weighbridge calibration tickets</span>
                  </div>
                </div>
              </div>
              <div className="p-space-md bg-surface flex flex-col gap-space-sm">
                <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Icon name="receipt_long" className="text-secondary text-base" />
                      <span className="font-label-md text-label-md font-bold text-on-surface">Waybill #WB-9824</span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold">
                      <Icon name="done_all" className="text-[13px]" /> Reconciled
                    </span>
                  </div>
                  <div className="space-y-1 my-1">
                    <div className="flex justify-between font-body-sm text-body-sm">
                      <span className="text-on-surface-variant">Delivered To:</span>
                      <span className="font-semibold text-on-surface">Premier Feed Mills, Oluyole Ibadan</span>
                    </div>
                    <div className="flex justify-between font-body-sm text-body-sm">
                      <span className="text-on-surface-variant">Commodity:</span>
                      <span className="text-on-surface">12.0 MT Yellow Feed Maize</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-surface-container-low grid grid-cols-3 gap-1 text-center">
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Gross Weight</span>
                      <span className="font-label-md text-label-md font-bold text-on-surface">28,420 kg</span>
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Tare Weight</span>
                      <span className="font-label-md text-label-md font-bold text-on-surface">16,420 kg</span>
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Net Certified</span>
                      <span className="font-label-md text-label-md font-bold text-primary">12,000 kg</span>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-secondary-container/20 flex items-center justify-between mt-1">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-secondary-container">Transfer Settled to Farm Books:</span>
                      <span className="font-headline-sm text-headline-sm font-bold text-primary">₦5,040,000</span>
                    </div>
                    <ScreenDialog
                      title="Weighbridge Slip #WB-9824"
                      side="center"
                      panel={
                        <div className="w-full max-w-md rounded-xl bg-surface-container-lowest p-space-md flex flex-col gap-3">
                          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Certified Weighbridge Ticket</h3>
                          <div className="p-3 rounded-lg bg-surface-container-low space-y-1.5 text-body-sm">
                            <div className="flex justify-between"><span>Ticket:</span><strong className="font-mono">#WB-9824-2026</strong></div>
                            <div className="flex justify-between"><span>Buyer:</span><strong>Premier Feed Mills, Oluyole</strong></div>
                            <div className="flex justify-between"><span>Gross / Tare:</span><span>28,420 kg / 16,420 kg</span></div>
                            <div className="flex justify-between"><span>Net Certified:</span><strong className="text-primary">12,000 kg (12.0 MT)</strong></div>
                            <div className="flex justify-between"><span>Settlement Amount:</span><strong className="text-primary">₦5,040,000.00</strong></div>
                            <div className="flex justify-between"><span>Bank Tx Ref:</span><span className="font-mono text-xs">ZENITH-TR-9948201</span></div>
                            <div className="flex justify-between"><span>Digital Seal:</span><span className="font-mono text-xs">SHA256: 8f7e...3d9a</span></div>
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold"
                              type="button"
                              onClick={() => {
                                downloadFile(
                                  "Weighbridge-Slip-WB-9824.txt",
                                  "DIGITAL CALIBRATED WEIGHBRIDGE SLIP #WB-9824\nBuyer: Premier Feed Mills Ibadan\nGross Weight: 28,420 kg\nTare Weight: 16,420 kg\nNet Certified: 12,000 kg\nAgreed Rate: ₦420,000 / MT\nSettled Value: ₦5,040,000\nPayment Method: Zenith Bank Commercial Escrow Release\nTimestamp: 2026-05-24 14:18:02 WAT\nAudit Signature: 0x8f7e91a0c41b3d9a",
                                  "text/plain"
                                );
                                showScreenToast("Weighbridge Slip WB-9824 downloaded.");
                              }}
                            >
                              Download Slip
                            </button>
                          </div>
                        </div>
                      }
                    >
                      <button onClick={() => {}} className="px-2.5 py-1 rounded bg-surface-container-lowest text-primary font-label-sm text-label-sm font-semibold shadow-sm hover:bg-surface-container-low transition-colors" type="button">
                        View Slip
                      </button>
                    </ScreenDialog>
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm pt-1">
                    <span className="truncate">Timestamp: 2026-05-24 14:18:02 WAT</span>
                    <span className="font-mono text-[10px] text-outline">SHA: 8f7e...3d9a</span>
                  </div>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-label-md text-label-md font-semibold text-on-surface">Season Off-take Quota Target</span>
                    <span className="font-label-md text-label-md font-bold text-primary">78% Fulfilled</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: "78%" }} />
                  </div>
                  <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant mt-1.5">
                    <span>Target: 240 MT</span>
                    <span>Delivered: 187.2 MT</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-space-md lg:mx-space-xl mb-space-xl p-space-md rounded-xl bg-surface-container-low shadow-sm flex flex-col sm:flex-row items-center justify-between gap-space-sm text-on-surface-variant">
          <div className="flex items-center gap-2 min-w-0">
            <Icon name="sync_saved_locally" className="text-secondary text-lg" />
            <span className="font-body-sm text-body-sm truncate">
              <strong>PowerSync Protocol Active:</strong> SQLite offline database mirrored. Local cryptographic weighbridge stamp: <span className="font-mono text-xs">hash:c7b94a...e102</span>
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0 font-label-sm text-label-sm">
            <span className="inline-flex items-center gap-1 text-secondary font-semibold">
              <span className="w-2 h-2 rounded-full bg-secondary" /> Cluster Online
            </span>
            <span>Oyo State Agro-Commerce Gateway v4.8</span>
          </div>
        </div>
      </div>
    </div>
  );
}
