"use client";

// Ported from the "customer_support_sla_resolution_desk" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { useState } from "react";
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogClose, showScreenToast } from "@/components/ds/screen-dialog";
import type { ScreenProps } from "./types";

interface Ticket {
  id: string;
  ref: string;
  title: string;
  category: "urgent" | "escrow" | "kyc" | "agro";
  priority: "P1 Critical" | "P2 Oper." | "P3 Normal";
  priorityClass: string;
  slaTime: string;
  requester: string;
  location: string;
  channel: string;
  assignee: string;
  bookingRef: string;
  description: string;
  escrowTotal: number;
  operatorPayout: number;
  farmerRefund: number;
}

const TICKETS: Ticket[] = [
  {
    id: "TIC-0582",
    ref: "#TIC-2026-0582",
    title: "Escrow Settlement Delayed: MF 375 Rotary Weeding halted by unmapped rocks",
    category: "urgent",
    priority: "P1 Critical",
    priorityClass: "bg-error-container text-error",
    slaTime: "18m SLA",
    requester: "Lateef Gbadamosi",
    location: "Iseyin Savanna, Plot M3",
    channel: "In-App (Termii SMS Synced)",
    assignee: "Quadri O.",
    bookingRef: "#BKG-2026-0492",
    description: "Muritala stopped the Massey Ferguson tractor after clearing 3.82 Ha of Plot M3. Granite rocks under the surface prevented full cultivation.",
    escrowTotal: 95000,
    operatorPayout: 80645.5,
    farmerRefund: 14354.5,
  },
  {
    id: "TIC-0579",
    ref: "#TIC-2026-0579",
    title: "NIMC vNIN Biometric Verification Timed Out during assisted onboarding",
    category: "kyc",
    priority: "P2 Oper.",
    priorityClass: "bg-surface-container text-on-tertiary-container",
    slaTime: "1h 40m left",
    requester: "FA: Folake Ibironke",
    location: "Ogbomoso Central Hub",
    channel: "Agent Tablet",
    assignee: "Unassigned",
    bookingRef: "#ONB-2026-1102",
    description: "NIMC gateway returned HTTP 504 Gateway Timeout during fingerprint biometric capture for cooperative member onboarding.",
    escrowTotal: 0,
    operatorPayout: 0,
    farmerRefund: 0,
  },
  {
    id: "TIC-0574",
    ref: "#TIC-2026-0574",
    title: "NPK 15:15:15 Requisition PO sync conflict on SQLite PowerSync",
    category: "agro",
    priority: "P2 Oper.",
    priorityClass: "bg-surface-container text-on-surface-variant",
    slaTime: "2h 15m left",
    requester: "Babatunde Lawal",
    location: "Abeokuta North Input Depot",
    channel: "PowerSync Offline Hub",
    assignee: "Seyi B.",
    bookingRef: "#PO-2026-8831",
    description: "Conflict between offline stock decrement and central inventory ledger during fertilizer bag dispatch.",
    escrowTotal: 420000,
    operatorPayout: 420000,
    farmerRefund: 0,
  },
  {
    id: "TIC-0568",
    ref: "#TIC-2026-0568",
    title: "Off-taker Weighbridge moisture deduction query (15.2% vs 14.0% std)",
    category: "escrow",
    priority: "P3 Normal",
    priorityClass: "bg-secondary-container text-on-secondary-container",
    slaTime: "4h 30m left",
    requester: "Psaltry Outgrowers Coop",
    location: "Ado-Awaye Intake Station",
    channel: "Web Portal",
    assignee: "Pending Customer",
    bookingRef: "#WB-2026-0941",
    description: "Cooperative disputes 1.2% moisture content penalty applied to 32 metric tonnes of harvested white maize.",
    escrowTotal: 8400000,
    operatorPayout: 8150000,
    farmerRefund: 250000,
  },
];

export function SupportDesk(_props: ScreenProps) {
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket>(TICKETS[0]);
  const [replyMode, setReplyMode] = useState<"public" | "private">("public");
  const [replyText, setReplyText] = useState(
    "Dear Mr. Gbadamosi & Mr. Lawal,\n\nOur Lead Agronomist has completed the satellite NDVI boundary and tractor telemetry review for Booking #BKG-2026-0492 (Plot M3). \n\nUnder CultivaNode Platform Terms §5.4 (Sub-surface Geological Obstacles), work was lawfully halted after 3.82 Ha of the total 4.50 Ha plot was executed cleanly:\n\n1. Operator Disbursement: ₦80,645.50 (84.89% prorated service fee) is cleared for immediate disbursement to Muritala Lawal's syndicate account.\n2. Farmer Escrow Refund: ₦14,354.50 (15.11% unworked portion) is released back to Lateef Gbadamosi's primary wallet instantly.\n\nBoth parties please confirm agreement below or reply via Termii SMS with 'ACCEPT 0582'."
  );

  // Modals
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showArbitrationModal, setShowArbitrationModal] = useState(false);
  const [showMacroModal, setShowMacroModal] = useState(false);
  const [inspectImage, setInspectImage] = useState<{ src: string; title: string; meta: string } | null>(null);

  // Filtered ticket list
  const filteredTickets = TICKETS.filter((ticket) => {
    if (filterCategory !== "all" && ticket.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        ticket.title.toLowerCase().includes(q) ||
        ticket.ref.toLowerCase().includes(q) ||
        ticket.requester.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleInsertDraft = (type: "prorated" | "policy" | "math") => {
    if (type === "prorated") {
      setReplyText((prev) =>
        prev + "\n\n[Prorated Settlement Clause]: Under §5.4, 3.82 Ha executed cleanly (84.89% pro-rata fee). Locked funds will be partitioned accordingly."
      );
      showScreenToast("Inserted Prorated Settlement Draft into reply composer.");
    } else if (type === "policy") {
      setReplyText((prev) =>
        prev + "\n\n[ToS §5.4 Sub-surface Impediment Policy]: When unforeseen bedrock prevents implement penetration, operator is excused from breach and compensated for verified acreage logged by RTK telemetry."
      );
      showScreenToast("Attached ToS §5.4 Policy into reply composer.");
    } else if (type === "math") {
      setReplyText((prev) =>
        prev + "\n\n[Escrow Math Breakdown]:\n• Total Escrow Deposit: ₦95,000.00\n• 3.82 Ha / 4.50 Ha = 84.89%\n• Operator Payout: ₦80,645.50\n• Farmer Refund: ₦14,354.50"
      );
      showScreenToast("Inserted Escrow Math Breakdown into reply composer.");
    }
  };

  const handleMarkResolved = () => {
    showScreenToast(`Ticket ${selectedTicket.ref} marked as RESOLVED. Settlement deed finalized.`);
  };

  const handleSaveDraft = () => {
    showScreenToast("Resolution draft saved to Supabase offline cache.");
  };

  const handleSendResolution = () => {
    const payoutRef = "PAY-ESC-" + Math.floor(100000 + Math.random() * 900000);
    showScreenToast(
      `Resolution dispatched via Termii SMS & App! Escrow split triggered: ₦${selectedTicket.operatorPayout.toLocaleString()} to operator, ₦${selectedTicket.farmerRefund.toLocaleString()} refund to farmer. Ref: ${payoutRef}`
    );
  };

  return (
    <div className="screen">
      <div className="flex flex-col w-full gap-space-lg pb-space-xl">
        <div className="flex flex-col gap-space-sm">
          <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-on-surface-variant">
            <span>Platform Administration</span>
            <Icon name="chevron_right" className="text-[14px]" />
            <span>Communication &amp; Support</span>
            <Icon name="chevron_right" className="text-[14px]" />
            <span className="text-primary font-semibold">Customer Support &amp; SLA Resolution Desk (§12.3)</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-space-md">
            <div className="flex flex-col">
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Customer Support &amp; SLA Resolution Desk (§12.3)</h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Realtime multi-tier agro-enterprise helpdesk, dispute triage &amp; escrow resolution engine</p>
            </div>
            <div className="flex flex-wrap items-center gap-space-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                <span>Supabase Realtime Synced</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-low text-primary font-label-sm text-label-sm shadow-sm">
                <Icon name="cell_tower" className="text-[15px] text-primary" />
                <span>Termii SMS / USSD Gateway</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface font-label-sm text-label-sm shadow-sm">
                <Icon name="timer" className="text-[15px] text-secondary" />
                <span>FCR Target: &lt; 45m</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm shadow-sm">
                <Icon name="verified_user" className="text-[15px] text-outline" />
                <span>NDPA 2023 Compliant PII Masking</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-md">
          <div className="bg-surface-container-lowest rounded-xl p-space-md flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-md text-label-md uppercase tracking-wider">Open Tickets</span>
              <Icon name="inbox" className="text-[20px] text-primary" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="font-metric-num text-metric-num text-on-surface">14</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-secondary-container text-on-secondary-container">-18% vs wk</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 font-label-sm text-label-sm text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-error" />
              <span>4 P1</span>
              <span className="text-outline-variant">·</span>
              <span className="w-2 h-2 rounded-full bg-on-tertiary-container" />
              <span>6 P2</span>
              <span className="text-outline-variant">·</span>
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span>4 P3</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-md flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-md text-label-md uppercase tracking-wider">SLA Risk Violations</span>
              <Icon name="notification_important" className="text-[20px] text-error" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="font-metric-num text-metric-num text-error">2 <span className="font-headline-sm text-headline-sm text-on-surface-variant font-normal">At Risk</span></span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-error-container text-error">&lt; 25m Left</span>
            </div>
            <div className="flex items-center justify-between mt-2 font-label-sm text-label-sm text-on-surface-variant">
              <span>Target: 0 Breaches</span>
              <span className="text-secondary font-semibold">0 Breached</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-md flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-md text-label-md uppercase tracking-wider">First Response (FRT)</span>
              <Icon name="speed" className="text-[20px] text-secondary" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="font-metric-num text-metric-num text-on-surface">11.4 <span className="font-body-md text-body-md font-medium text-on-surface-variant">min</span></span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-secondary-container text-on-secondary-container">+3.2m faster</span>
            </div>
            <div className="flex items-center justify-between mt-2 font-label-sm text-label-sm text-on-surface-variant">
              <span>Target: &lt; 20m</span>
              <span className="font-semibold text-primary">SLA Compliance 98.2%</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-md flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-md text-label-md uppercase tracking-wider">Customer CSAT</span>
              <Icon name="reviews" className="text-[20px] text-on-tertiary-container" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="font-metric-num text-metric-num text-on-surface">94.8%</span>
              <div className="flex items-center text-on-tertiary-container text-[12px] font-bold">
                <Icon name="star" className="text-[16px]" /> 4.88
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 font-label-sm text-label-sm text-on-surface-variant">
              <span>342 ratings (SW Hub)</span>
              <span className="text-primary font-semibold">Oyo / Osun / Ogun</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-md flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-md text-label-md uppercase tracking-wider">Omnichannel Split</span>
              <Icon name="hub" className="text-[20px] text-outline" />
            </div>
            <div className="w-full flex h-2 rounded-full overflow-hidden mt-3 bg-surface-container">
              <div className="bg-primary h-full" style={{ width: "42%" }} title="In-App 42%" />
              <div className="bg-secondary h-full" style={{ width: "31%" }} title="Termii SMS/USSD 31%" />
              <div className="bg-on-tertiary-container h-full" style={{ width: "18%" }} title="Field Agent 18%" />
              <div className="bg-outline h-full" style={{ width: "9%" }} title="Voice IVR 9%" />
            </div>
            <div className="grid grid-cols-2 gap-1 mt-2 font-label-sm text-label-sm text-on-surface-variant">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> App: 42%</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> SMS: 31%</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container" /> Agent: 18%</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-outline" /> IVR: 9%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-space-lg items-start">
          <div className="col-span-12 xl:col-span-3 flex flex-col gap-space-md">
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="scan" className="text-primary text-[20px]" />
                  <span className="font-headline-sm text-headline-sm text-on-surface">Ticket Triage</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container font-label-sm text-label-sm font-bold">
                  {filteredTickets.length} Active
                </span>
              </div>

              <div className="flex gap-1 overflow-x-auto pb-1 text-label-sm font-label-sm">
                <button
                  onClick={() => setFilterCategory("all")}
                  className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap cursor-pointer ${filterCategory === "all" ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"}`}
                  type="button"
                >
                  All ({TICKETS.length})
                </button>
                <button
                  onClick={() => setFilterCategory("urgent")}
                  className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap flex items-center gap-1 cursor-pointer ${filterCategory === "urgent" ? "bg-error text-on-error" : "bg-surface-container text-error hover:bg-error-container"}`}
                  type="button"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" /> Urgent
                </button>
                <button
                  onClick={() => setFilterCategory("escrow")}
                  className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap cursor-pointer ${filterCategory === "escrow" ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"}`}
                  type="button"
                >
                  Escrow
                </button>
                <button
                  onClick={() => setFilterCategory("kyc")}
                  className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap cursor-pointer ${filterCategory === "kyc" ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"}`}
                  type="button"
                >
                  KYC
                </button>
                <button
                  onClick={() => setFilterCategory("agro")}
                  className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap cursor-pointer ${filterCategory === "agro" ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"}`}
                  type="button"
                >
                  Agro
                </button>
              </div>

              <div className="relative">
                <Icon name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 rounded-lg bg-surface-container-low text-on-surface text-body-sm font-body-sm focus:outline-none focus:bg-surface-container"
                  placeholder="Search ticket #, farmer, booking..."
                  type="text"
                />
              </div>

              <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant bg-surface-container-low px-2.5 py-1.5 rounded-lg">
                <span className="truncate">Category: Machinery &amp; Escrow Disputes</span>
                <Icon name="expand_more" className="text-[16px]" />
              </div>

              <div className="flex flex-col gap-2 mt-1">
                {filteredTickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-space-sm rounded-xl transition-all flex flex-col gap-1.5 cursor-pointer ${selectedTicket.id === t.id ? "bg-surface-container-high text-on-surface ring-2 ring-primary/30 shadow-sm" : "bg-surface-container-lowest hover:bg-surface-container-low text-on-surface shadow-sm"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-label-sm text-label-sm font-bold ${selectedTicket.id === t.id ? "text-primary" : "text-on-surface-variant"}`}>{t.ref}</span>
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${t.priorityClass} font-label-sm text-label-sm font-bold`}>
                        <Icon name="alarm" className="text-[13px]" />
                        <span>{t.slaTime}</span>
                      </div>
                    </div>
                    <h4 className="font-headline-sm text-body-md font-semibold text-on-surface line-clamp-2 leading-snug">{t.title}</h4>
                    <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant pt-1">
                      <span className="truncate font-medium text-on-surface">{t.requester}</span>
                      <span className="font-semibold">{t.priority}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-label-sm text-outline">
                      <span className="flex items-center gap-1"><Icon name="sms" className="text-[12px]" /> {t.channel}</span>
                      <span>Assignee: {t.assignee}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-12 xl:col-span-6 flex flex-col gap-space-md">
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
              <div className="flex flex-col gap-space-xs pb-space-sm border-b border-surface-container">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded ${selectedTicket.priorityClass} font-label-sm text-label-sm font-bold flex items-center gap-1`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" /> {selectedTicket.priority}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Ref: {selectedTicket.ref}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md">
                    <Icon name="timer" className="text-error text-[18px]" />
                    <span className="text-on-surface-variant">Resolution SLA:</span>
                    <span className="font-bold text-error font-metric-num text-[15px]" id="sla-countdown">{selectedTicket.slaTime}</span>
                  </div>
                </div>

                <h2 className="font-headline-md text-headline-md text-on-surface leading-tight mt-1">{selectedTicket.title}</h2>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-space-md text-label-sm font-label-sm text-on-surface-variant pt-1">
                  <span className="flex items-center gap-1"><Icon name="schedule" className="text-[15px] text-primary" /> Opened 42m ago by {selectedTicket.requester}</span>
                  <span className="flex items-center gap-1"><Icon name="forum" className="text-[15px] text-secondary" /> Channel: {selectedTicket.channel}</span>
                  <span className="flex items-center gap-1 text-primary font-semibold"><Icon name="tag" className="text-[15px]" /> Booking {selectedTicket.bookingRef}</span>
                  <span className="flex items-center gap-1"><Icon name="location_on" className="text-[15px] text-outline" /> {selectedTicket.location}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-space-xs bg-surface-container-low p-2 rounded-lg">
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    onClick={() => setShowReassignModal(true)}
                    className="px-2.5 py-1.5 rounded bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-sm text-label-sm flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
                    type="button"
                  >
                    <Icon name="person_add" className="text-[16px] text-primary" /> Reassign ({selectedTicket.assignee})
                  </button>
                  <button
                    onClick={() => setShowArbitrationModal(true)}
                    className="px-2.5 py-1.5 rounded bg-surface-container-lowest hover:bg-surface-container text-tertiary-container font-label-sm text-label-sm flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
                    type="button"
                  >
                    <Icon name="gavel" className="text-[16px] text-on-tertiary-container" /> Escalate Arbitration (§11.3)
                  </button>
                  <button
                    onClick={() => setShowMacroModal(true)}
                    className="px-2.5 py-1.5 rounded bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-sm text-label-sm flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
                    type="button"
                  >
                    <Icon name="bolt" className="text-[16px] text-secondary" /> Apply Macro
                  </button>
                </div>
                <button
                  onClick={handleMarkResolved}
                  className="px-3 py-1.5 rounded bg-primary text-on-primary hover:bg-primary-container font-label-sm text-label-sm font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  type="button"
                >
                  <Icon name="check_circle" className="text-[16px]" /> Mark Resolved
                </button>
              </div>

              <div className="flex flex-col gap-space-md">
                <div className="flex items-center justify-between text-label-sm font-label-sm text-outline">
                  <span className="uppercase tracking-wider">Multi-Party Investigation Stream</span>
                  <span className="flex items-center gap-1 text-secondary"><span className="w-2 h-2 rounded-full bg-secondary" /> Live Stream Active</span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center shrink-0 mt-0.5">
                    <Icon name="smart_toy" className="text-outline text-[16px]" />
                  </div>
                  <div className="flex-1 bg-surface-container-low rounded-xl p-space-sm flex flex-col gap-1">
                    <div className="flex items-center justify-between text-label-sm font-label-sm">
                      <span className="font-bold text-on-surface">CultivaNode Automated Escalation Engine</span>
                      <span className="text-on-surface-variant">42m ago</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Ticket automatically provisioned from in-field operator pause signal on Booking {selectedTicket.bookingRef}. Telemetry flagged zero tractor velocity for 45 minutes on uncultivated perimeter.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center shrink-0 mt-0.5 text-on-primary-fixed font-bold font-label-sm text-label-sm">LG</div>
                  <div className="flex-1 bg-surface-container-lowest rounded-xl p-space-sm shadow-sm flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-label-md text-label-md font-semibold text-on-surface">{selectedTicket.requester}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-surface-container text-on-surface-variant">Requester</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">40m ago via {selectedTicket.channel}</span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface leading-relaxed">&quot;{selectedTicket.description}&quot;</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0 mt-0.5">
                    <Icon name="lock" className="text-[16px]" />
                  </div>
                  <div className="flex-1 bg-tertiary-fixed/15 rounded-xl p-space-sm flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-label-md text-label-md font-bold text-tertiary">Internal Agronomist Note (Private)</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">by {selectedTicket.assignee}</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">28m ago</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">Reviewed IoT tractor CAN-bus telemetry and operator PoW photos. Disc plough struck an unmapped granite outcrop at Lat 7.9732° N, Long 3.5901° E. Under ToS §5.4 (Geological Impassability), operator is entitled to prorated 84.89% payout (₦80,645.50), and farmer gets instant escrow refund of ₦14,354.50.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center shrink-0 mt-0.5 font-bold font-label-sm text-label-sm">ML</div>
                  <div className="flex-1 bg-surface-container-lowest rounded-xl p-space-sm shadow-sm flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-label-md text-label-md font-semibold text-on-surface">Muritala Lawal</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-surface-container text-on-surface-variant">Tractor Operator / Syndicate #04</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">22m ago via Termii USSD</span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface leading-relaxed">&quot;Attached 2x PoW photos of broken hydraulic shear pin and granite boundary. We did 3.82 Ha clean work before striking bedrock. We request quick payout for completed 3.82 Ha so we can replace pin at Iseyin central depot.&quot;</p>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div
                        onClick={() =>
                          setInspectImage({
                            src: "/images/screens/27b7c685c850.webp",
                            title: "Shear_Pin_Shear.jpg",
                            meta: "2.4 MB · GPS Tagged Lat 7.9732° N, Long 3.5901° E",
                          })
                        }
                        className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low hover:bg-surface-container cursor-pointer transition-colors"
                      >
                        <div className="w-10 h-10 rounded bg-cover bg-center shrink-0 shadow-sm" style={{ backgroundImage: "url('/images/screens/27b7c685c850.webp')" }} />
                        <div className="flex flex-col min-w-0">
                          <span className="font-label-sm text-label-sm text-on-surface truncate font-semibold">Shear_Pin_Shear.jpg</span>
                          <span className="font-label-sm text-label-sm text-outline">2.4 MB · GPS Tagged</span>
                        </div>
                      </div>
                      <div
                        onClick={() =>
                          setInspectImage({
                            src: "/images/screens/5fc32c9b79a8.webp",
                            title: "Granite_Ridge_Edge.jpg",
                            meta: "3.1 MB · GPS Tagged Lat 7.9733° N, Long 3.5902° E",
                          })
                        }
                        className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low hover:bg-surface-container cursor-pointer transition-colors"
                      >
                        <div className="w-10 h-10 rounded bg-cover bg-center shrink-0 shadow-sm" style={{ backgroundImage: "url('/images/screens/5fc32c9b79a8.webp')" }} />
                        <div className="flex flex-col min-w-0">
                          <span className="font-label-sm text-label-sm text-on-surface truncate font-semibold">Granite_Ridge_Edge.jpg</span>
                          <span className="font-label-sm text-label-sm text-outline">3.1 MB · GPS Tagged</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col rounded-xl bg-surface-container-low p-space-md gap-space-sm mt-space-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 bg-surface-container p-0.5 rounded-lg">
                    <button
                      onClick={() => setReplyMode("public")}
                      className={`px-3 py-1 rounded-md font-bold font-label-sm text-label-sm transition-colors cursor-pointer ${replyMode === "public" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
                      type="button"
                    >
                      Reply to Farmer &amp; Operator (Public)
                    </button>
                    <button
                      onClick={() => setReplyMode("private")}
                      className={`px-3 py-1 rounded-md font-bold font-label-sm text-label-sm transition-colors cursor-pointer ${replyMode === "private" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
                      type="button"
                    >
                      Internal Staff Note (Private)
                    </button>
                  </div>
                  <div className="flex items-center gap-2 font-label-sm text-label-sm">
                    <span className="text-on-surface-variant">Language:</span>
                    <select className="bg-surface-container-lowest text-on-surface font-semibold py-1 px-2 rounded border-0 text-label-sm">
                      <option>English</option>
                      <option>Yorùbá</option>
                      <option>Naija Pidgin</option>
                    </select>
                    <label className="flex items-center gap-1 text-on-surface-variant cursor-pointer">
                      <input defaultChecked className="rounded text-primary focus:ring-0" type="checkbox" />
                      <span>Termii SMS Copy</span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => handleInsertDraft("prorated")}
                    className="px-2 py-1 rounded bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-sm text-label-sm shadow-sm flex items-center gap-1 cursor-pointer"
                    type="button"
                  >
                    <Icon name="add_task" className="text-[14px] text-primary" /> Insert Prorated Settlement Draft
                  </button>
                  <button
                    onClick={() => handleInsertDraft("policy")}
                    className="px-2 py-1 rounded bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-sm text-label-sm shadow-sm flex items-center gap-1 cursor-pointer"
                    type="button"
                  >
                    <Icon name="policy" className="text-[14px] text-secondary" /> Attach ToS §5.4 Policy
                  </button>
                  <button
                    onClick={() => handleInsertDraft("math")}
                    className="px-2 py-1 rounded bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-sm text-label-sm shadow-sm flex items-center gap-1 cursor-pointer"
                    type="button"
                  >
                    <Icon name="calculate" className="text-[14px] text-on-tertiary-container" /> Escrow Math Breakdown
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full p-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed resize-none shadow-sm"
                    placeholder="Compose customer resolution..."
                    rows={5}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant">
                    <span className="flex items-center gap-1 text-secondary font-semibold">
                      <Icon name="check" className="text-[16px]" /> Auto-saved Draft
                    </span>
                    <span>· {replyText.split(/\s+/).filter(Boolean).length} words</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveDraft}
                      className="px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container font-label-sm text-label-sm font-semibold shadow-sm transition-colors cursor-pointer"
                      type="button"
                    >
                      Save Draft Only
                    </button>
                    <button
                      onClick={handleSendResolution}
                      className="px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-sm text-label-sm font-semibold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                      type="button"
                    >
                      <Icon name="send" className="text-[18px]" />
                      <span>Send Resolution &amp; Trigger Payout Draft</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 xl:col-span-3 flex flex-col gap-space-md">
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
              <div className="flex items-center justify-between pb-1 border-b border-surface-container">
                <span className="font-headline-sm text-headline-sm text-on-surface">Escrow &amp; Counterparties</span>
                <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm font-bold">Zenith Bank</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-label-sm">LG</div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-md text-label-md font-bold text-on-surface truncate">{selectedTicket.requester}</span>
                    <span className="font-label-sm text-label-sm text-outline">Tier 1 NIN Verified · 12 Bookings</span>
                  </div>
                </div>
                <span className="font-label-sm text-label-sm font-bold text-secondary">4.8★</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-on-secondary font-bold text-label-sm">ML</div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-md text-label-md font-bold text-on-surface truncate">Muritala Lawal (Syn. #04)</span>
                    <span className="font-label-sm text-label-sm text-outline">Tier 2 BVN · Leadway Insured</span>
                  </div>
                </div>
                <span className="font-label-sm text-label-sm font-bold text-secondary">4.95★</span>
              </div>
              <div className="flex flex-col gap-1.5 p-space-sm rounded-lg bg-surface-container-high/40">
                <div className="flex items-center justify-between font-label-sm text-label-sm">
                  <span className="text-on-surface-variant">Escrow Principal Locked:</span>
                  <span className="font-bold text-on-surface">₦{selectedTicket.escrowTotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between font-label-sm text-label-sm text-secondary">
                  <span>Operator Payout (84.89%):</span>
                  <span className="font-bold">+₦{selectedTicket.operatorPayout.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between font-label-sm text-label-sm text-primary">
                  <span>Farmer Refund (15.11%):</span>
                  <span className="font-bold">₦{selectedTicket.farmerRefund.toLocaleString()}</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden flex mt-1">
                  <div className="h-full bg-secondary" style={{ width: "84.89%" }} />
                  <div className="h-full bg-primary" style={{ width: "15.11%" }} />
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <span className="font-headline-sm text-headline-sm text-on-surface">Cadastral Telemetry</span>
                <span className="font-label-sm text-label-sm text-secondary font-bold">GPS Verified</span>
              </div>
              <div className="relative w-full h-40 rounded-lg overflow-hidden bg-surface-container flex items-center justify-center">
                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('/images/screens/963b7b4c7be9.webp')" }} />
                <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 240 160">
                  <polygon fill="rgba(0, 108, 73, 0.35)" points="15,20 185,20 185,140 15,140" stroke="#006c49" strokeWidth="2" />
                  <polygon fill="rgba(186, 26, 26, 0.45)" points="185,20 225,20 225,140 185,140" stroke="#ba1a1a" strokeDasharray="4" strokeWidth="2" />
                </svg>
                <div className="absolute bottom-2 left-2 bg-surface-container-lowest/90 px-2 py-0.5 rounded text-[10px] font-bold text-on-surface">Plot M3 (4.50 Ha)</div>
                <div className="absolute top-2 right-2 bg-error text-on-error px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">Granite Bedrock 0.68 Ha</div>
              </div>
              <div className="flex items-center justify-between text-label-sm font-label-sm pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-secondary" />
                  <span className="text-on-surface-variant">Cleared: 3.82 Ha</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-error" />
                  <span className="text-on-surface-variant">Rocky: 0.68 Ha</span>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon name="psychology" className="text-[18px] text-primary" />
                  <span className="font-headline-sm text-headline-sm text-on-surface">AI Grounding (§11.5)</span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">RAG v4.2</span>
              </div>
              <div
                onClick={() => {
                  setReplyText((prev) => prev + "\n\n[Clause #AGR-TOS-54 Applied]: Impassable Terrain & Geological Obstacles Resolution Protocol authorizes immediate pro-rata compensation based on verifiable GPS telemetry.");
                  showScreenToast("Clause #AGR-TOS-54 inserted into reply composer.");
                }}
                className="p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container cursor-pointer transition-colors flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm font-bold text-primary">#AGR-TOS-54</span>
                  <span className="px-1.5 py-0.2 rounded bg-secondary-container text-on-secondary-container text-[10px] font-bold">98.4% Match</span>
                </div>
                <p className="font-label-md text-label-md font-semibold text-on-surface leading-tight">Impassable Terrain &amp; Geological Obstacles Resolution Protocol</p>
                <p className="font-body-sm text-body-sm text-outline line-clamp-2 text-[12px]">Authorizes immediate pro-rata compensation based on verifiable GPS telemetry if bedrock prevents implement penetration.</p>
                <button className="mt-1 text-left font-label-sm text-label-sm text-primary font-bold hover:underline flex items-center gap-0.5" type="button">
                  <span>Insert clause into reply</span>
                  <Icon name="arrow_forward" className="text-[13px]" />
                </button>
              </div>
              <div
                onClick={() => {
                  setReplyText((prev) => prev + "\n\n[Clause #FIN-ESC-09 Applied]: Partial Proof-of-Work Escrow Disbursement Workflow authorizes locked funds split between contractor wallet and farmer refund account.");
                  showScreenToast("Clause #FIN-ESC-09 inserted into reply composer.");
                }}
                className="p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container cursor-pointer transition-colors flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm font-bold text-on-surface-variant">#FIN-ESC-09</span>
                  <span className="px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant text-[10px] font-bold">95.1% Match</span>
                </div>
                <p className="font-label-md text-label-md font-semibold text-on-surface leading-tight">Partial Proof-of-Work (PoW) Escrow Disbursement Workflow</p>
                <p className="font-body-sm text-body-sm text-outline line-clamp-2 text-[12px]">Step-by-step guideline for splitting locked funds between contractor wallet and farmer refund account.</p>
                <button className="mt-1 text-left font-label-sm text-label-sm text-primary font-bold hover:underline flex items-center gap-0.5" type="button">
                  <span>Insert clause into reply</span>
                  <Icon name="arrow_forward" className="text-[13px]" />
                </button>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
              <span className="font-headline-sm text-headline-sm text-on-surface">Escalation Ladder</span>
              <div className="flex flex-col gap-2 relative pl-4 border-l-2 border-surface-container text-label-sm font-label-sm">
                <div className="flex flex-col relative">
                  <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-secondary" />
                  <span className="font-bold text-on-surface">Level 1: Auto Triage</span>
                  <span className="text-on-surface-variant text-[11px]">Completed in 6.4m (Target &lt; 20m)</span>
                </div>
                <div className="flex flex-col relative pt-1">
                  <span className="absolute -left-[21px] top-2 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-primary-container" />
                  <span className="font-bold text-primary">Level 2: Lead Agronomist Investigation</span>
                  <span className="text-on-surface-variant text-[11px]">In progress · {selectedTicket.assignee} (36m elapsed)</span>
                </div>
                <div className="flex flex-col relative pt-1 opacity-50">
                  <span className="absolute -left-[21px] top-2 w-2.5 h-2.5 rounded-full bg-outline" />
                  <span className="font-bold text-on-surface">Level 3: Formal Arbitration Board (§11.3)</span>
                  <span className="text-on-surface-variant text-[11px]">Escalates if unresolved in 18m 42s</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-space-md p-space-md rounded-xl bg-surface-container-lowest shadow-sm text-label-sm font-label-sm text-on-surface-variant">
          <div className="flex flex-wrap items-center gap-space-md">
            <div className="flex items-center gap-1.5">
              <Icon name="lock_clock" className="text-secondary text-[16px]" />
              <span>NDPA 2023 Compliant Masking Active (NIN/BVN Tokenized)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Icon name="fingerprint" className="text-outline text-[16px]" />
              <span>Audit Session Hash: <code className="font-mono text-on-surface">0x8c2a...f401</code> (SHA-256)</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-space-md">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span>SQLite PowerSync Sync Latency: <strong className="text-on-surface">28ms</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Icon name="sim_card" className="text-primary text-[16px]" />
              <span>Termii SMS Pool: <strong className="text-on-surface">₦18,420.00</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Reassign Modal */}
      {showReassignModal && (
        <ScreenDialog
          title="Reassign Helpdesk Ticket"
          subtitle={`Assign ${selectedTicket.ref} to another Agronomist or Operations Lead`}
          onClose={() => setShowReassignModal(false)}
          panel={
            <div className="flex flex-col gap-space-md p-space-md">
              <div className="flex flex-col gap-space-xs">
                <label className="font-label-sm text-on-surface font-semibold">Select Support Agent</label>
                <select className="h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm">
                  <option>Quadri Olapade (Lead Agronomist)</option>
                  <option>Folake Ibironke (Field Extension Specialist)</option>
                  <option>Seyi Balogun (Fintech &amp; Escrow Officer)</option>
                  <option>Engr. Tunde Adeleke (Mechanization Lead)</option>
                </select>
              </div>
              <div className="flex justify-end gap-space-sm pt-space-xs">
                <ScreenDialogClose onClick={() => setShowReassignModal(false)}>Cancel</ScreenDialogClose>
                <button
                  onClick={() => {
                    showScreenToast(`Ticket ${selectedTicket.ref} successfully reassigned.`);
                    setShowReassignModal(false);
                  }}
                  className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md font-semibold cursor-pointer"
                  type="button"
                >
                  Confirm Reassignment
                </button>
              </div>
            </div>
          }
        />
      )}

      {/* Arbitration Modal */}
      {showArbitrationModal && (
        <ScreenDialog
          title="Escalate to Formal Arbitration Board (§11.3)"
          subtitle="Independent Agricultural Development Programme (ADP) Statutory Tribunal"
          onClose={() => setShowArbitrationModal(false)}
          panel={
            <div className="flex flex-col gap-space-md p-space-md">
              <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col gap-2">
                <span className="font-label-md font-bold text-on-surface">Arbitration Dossier Inclusions:</span>
                <ul className="text-body-sm space-y-1 text-on-surface-variant">
                  <li>• High-resolution NDVI multi-spectral satellite polygon comparison</li>
                  <li>• CAN-bus CAN-ID 0x18FEE400 engine torque curve logs</li>
                  <li>• Operator submitted georeferenced bedrock outcrop photos</li>
                  <li>• Providus Bank escrow lock statement (₦95,000.00)</li>
                </ul>
              </div>
              <div className="flex justify-end gap-space-sm pt-space-xs">
                <ScreenDialogClose onClick={() => setShowArbitrationModal(false)}>Cancel</ScreenDialogClose>
                <button
                  onClick={() => {
                    showScreenToast("Tribunal arbitration packet logged with South-West ADP Arbitration Board.");
                    setShowArbitrationModal(false);
                  }}
                  className="px-space-md py-2 rounded-lg bg-tertiary text-on-tertiary font-label-md font-bold cursor-pointer"
                  type="button"
                >
                  Submit Formal Tribunal Claim
                </button>
              </div>
            </div>
          }
        />
      )}

      {/* Macro Modal */}
      {showMacroModal && (
        <ScreenDialog
          title="Apply Support Resolution Macro"
          subtitle="Pre-approved response templates and automated workflows"
          onClose={() => setShowMacroModal(false)}
          panel={
            <div className="flex flex-col gap-space-sm p-space-md">
              <button
                onClick={() => {
                  handleInsertDraft("prorated");
                  setShowMacroModal(false);
                }}
                className="p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container text-left flex flex-col gap-1 cursor-pointer transition-colors"
                type="button"
              >
                <span className="font-bold text-primary font-label-md">Macro #01: Standard Prorated Settlement</span>
                <span className="text-body-sm text-on-surface-variant">Applies §5.4 geological obstacle terms and calculates 84.89% operator / 15.11% farmer escrow release.</span>
              </button>
              <button
                onClick={() => {
                  setReplyText((prev) => prev + "\n\n[Macro #02: Request Field Agronomist Visit]: An accredited Oyo ADP field scout has been dispatched to perform in-person cadastral verification.");
                  showScreenToast("Macro #02 applied.");
                  setShowMacroModal(false);
                }}
                className="p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container text-left flex flex-col gap-1 cursor-pointer transition-colors"
                type="button"
              >
                <span className="font-bold text-primary font-label-md">Macro #02: Dispatch Field Extension Scout</span>
                <span className="text-body-sm text-on-surface-variant">Dispatches local ADP extension agent to inspect plot boundary within 4 hours.</span>
              </button>
              <div className="flex justify-end pt-space-xs">
                <ScreenDialogClose onClick={() => setShowMacroModal(false)}>Close</ScreenDialogClose>
              </div>
            </div>
          }
        />
      )}

      {/* Photo Inspector Modal */}
      {inspectImage && (
        <ScreenDialog
          title={inspectImage.title}
          subtitle={inspectImage.meta}
          onClose={() => setInspectImage(null)}
          panel={
            <div className="flex flex-col gap-space-md p-space-md">
              <div className="w-full h-80 rounded-xl bg-surface-container relative overflow-hidden flex items-center justify-center">
                <img src={inspectImage.src} alt={inspectImage.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex justify-end pt-space-xs">
                <ScreenDialogClose onClick={() => setInspectImage(null)}>Close Photo</ScreenDialogClose>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
}
