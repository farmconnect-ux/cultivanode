"use client";

// Ported from the "messaging_communication_hub" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { useState } from "react";
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogClose, showScreenToast } from "@/components/ds/screen-dialog";
import { downloadFile } from "@/lib/download";
import type { ScreenProps } from "./types";

interface Message {
  id: string;
  sender: string;
  role: string;
  initials: string;
  timestamp: string;
  content: string;
  isSelf?: boolean;
  images?: { title: string; meta: string; src: string; alt: string }[];
  audio?: { title: string; duration: string; lang: string };
  smsNotice?: string;
  telemetryNotice?: string;
  yorubaTranslation?: string;
}

interface Thread {
  id: string;
  title: string;
  subtitle: string;
  category: "bookings" | "produce" | "advisory" | "support";
  initials: string;
  time: string;
  unreadCount?: number;
  snippet: string;
  tags: string[];
  farmerName: string;
  farmerRole: string;
  farmerInitials: string;
  operatorName: string;
  operatorRole: string;
  operatorInitials: string;
  bookingRef: string;
  escrowVal: string;
  parcel: string;
  status: string;
}

const INITIAL_THREADS: Thread[] = [
  {
    id: "thread-1",
    title: "Muritala Lawal & L. Gbadamosi",
    subtitle: "#BKG-2026-0492 · Rotary Weeding",
    category: "bookings",
    initials: "ML",
    time: "14:18 WAT",
    unreadCount: 1,
    snippet: "GPS polygon shows 18.5 Ha completed. I have uploaded the boulder boundary photos for arbitration...",
    tags: ["Escrow ₦95k", "48h SLA", "Proration Stall"],
    farmerName: "Gbadamosi Lateef",
    farmerRole: "Farmer",
    farmerInitials: "GL",
    operatorName: "Muritala Lawal",
    operatorRole: "Tier 2 Operator",
    operatorInitials: "ML",
    bookingRef: "#BKG-2026-0492",
    escrowVal: "₦95,000 Zenith Escrow",
    parcel: "Iseyin Savanna — Plot M3 (4.50 Ha)",
    status: "PoW Verification",
  },
  {
    id: "thread-2",
    title: "Psaltry PLC & Saki Outgrowers",
    subtitle: "Off-take #CTR-2026-081 · Cassava",
    category: "produce",
    initials: "PI",
    time: "13:45 WAT",
    snippet: "Weighbridge gross ticket #9921 stamped. Dry matter starch test results attached (24.8%)...",
    tags: ["Variance: -1.2 MT", "Ticket QC"],
    farmerName: "Saki Outgrowers Coop",
    farmerRole: "Cooperative Lead",
    farmerInitials: "SO",
    operatorName: "Psaltry Procurement",
    operatorRole: "Factory QA",
    operatorInitials: "PI",
    bookingRef: "#CTR-2026-081",
    escrowVal: "₦10,450,000 Escrow",
    parcel: "Ado-Awaye Factory Inflow Dock",
    status: "Weighbridge Sync",
  },
  {
    id: "thread-3",
    title: "Dr. Quadri & Folake Ibironke",
    subtitle: "Advisory · Plot M2 Maize Top-Dress",
    category: "advisory",
    initials: "QO",
    time: "11:20 WAT",
    snippet: "Flash squall alert: do not apply the 2nd Urea split until soil moisture stabilizes below 80%...",
    tags: ["Yorùbá Audio", "Weather Flag"],
    farmerName: "Folake Ibironke",
    farmerRole: "Maize Smallholder",
    farmerInitials: "FI",
    operatorName: "Dr. Quadri Olapade",
    operatorRole: "Chief Agronomist",
    operatorInitials: "QO",
    bookingRef: "#ADV-2026-118",
    escrowVal: "Advisory Grant Funded",
    parcel: "Iseyin South — Plot M2 (3.2 Ha)",
    status: "Weather Advisory",
  },
  {
    id: "thread-4",
    title: "Oluwaseun Agrochemicals",
    subtitle: "Input PO #ORD-8812 · Emamectin",
    category: "support",
    initials: "OA",
    time: "09:15 WAT",
    snippet: "Consignment dispatched via low-loader transport from Ibadan depot to Iseyin hub...",
    tags: ["In-Transit", "Waybill #884"],
    farmerName: "Iseyin Aggregation Depot",
    farmerRole: "Depot Manager",
    farmerInitials: "ID",
    operatorName: "Oluwaseun Agro Supply",
    operatorRole: "Verified Supplier",
    operatorInitials: "OA",
    bookingRef: "#ORD-8812",
    escrowVal: "₦465,000 Escrow",
    parcel: "Iseyin Agro-Hub Warehouse",
    status: "In-Transit",
  },
  {
    id: "thread-5",
    title: "Alhaji Kazeem Syndicate",
    subtitle: "Assisted Onboarding · Fleet KYC",
    category: "bookings",
    initials: "AK",
    time: "Yesterday",
    snippet: "Leadway insurance certificate and MF 375 chassis photos uploaded for Tier 3 review...",
    tags: ["Tier 3 Review", "Field Agent Reg"],
    farmerName: "Alhaji Kazeem",
    farmerRole: "Syndicate Lead",
    farmerInitials: "AK",
    operatorName: "Compliance Desk",
    operatorRole: "Admin Auditor",
    operatorInitials: "CD",
    bookingRef: "#KYC-FLEET-09",
    escrowVal: "Fleet Registered",
    parcel: "Saki Machinery Depot #04",
    status: "KYC Pending",
  },
];

const INITIAL_MESSAGES: Record<string, Message[]> = {
  "thread-1": [
    {
      id: "m-1",
      sender: "Gbadamosi Lateef",
      role: "Farmer",
      initials: "GL",
      timestamp: "13:50 WAT",
      content:
        "Good day Operator Muritala. The tractor stopped near the northern edge of Plot M3 before clearing the 0.68 Ha rocky ridge. Will you finish today? We have rain predicted for tomorrow.",
    },
    {
      id: "m-2",
      sender: "Muritala Lawal",
      role: "Operator",
      initials: "ML",
      timestamp: "14:02 WAT",
      isSelf: true,
      content:
        "E ku osan Baba. The northern sector has unmapped granite outcrops. The disc harrow struck rock twice and risked snapping the hydraulic arm. Under CultivaNode ToS §5.4 (Impassable Terrain), we must abort that zone for equipment safety.",
      images: [
        {
          title: "Granite_Ridge_041.jpg",
          meta: "7.9732° N, 3.5901° E · 3.2 MB",
          src: "/images/screens/98a0eb878164.webp",
          alt: "Close up photograph of tractor implement struck against rugged granite outcrop boulders in agricultural field under bright tropical daylight with visible earth scratches and equipment safety markers",
        },
        {
          title: "Disc_Scrape_042.jpg",
          meta: "7.9735° N, 3.5905° E · 2.8 MB",
          src: "/images/screens/e1cab0077ee0.webp",
          alt: "Close-up field photo of agricultural disc harrow equipment showing safe shear pin condition next to grey bedrock stone on Nigerian farmland plot in dry grass",
        },
      ],
      yorubaTranslation: "Àwọn àpáta wà ní apá àríwá tí ó lè ba ohun èlò jẹ́...",
    },
    {
      id: "m-3",
      sender: "PostGIS Telemetry Engine",
      role: "System Engine",
      initials: "PG",
      timestamp: "14:08 WAT",
      content: "",
      telemetryNotice:
        "RTK track log verifies 3.82 Ha traversed (84.89% of 4.50 Ha target). Suggested prorated settlement: ₦80,645.50 to Operator / ₦14,354.50 refund to Farmer.",
    },
    {
      id: "m-4",
      sender: "Dr. Quadri Olapade",
      role: "Lead Agronomist & Inspector",
      initials: "QO",
      timestamp: "14:14 WAT",
      content:
        "I am on-site at Plot M3 with the GPS RTK rover. I confirm the granite ridge is impassable. Both parties please agree to the 84.9% proration split so we release funds without dispute escalation.",
      audio: {
        title: "Voice Note · Quadri Olapade",
        duration: "0:24",
        lang: "EN + YOR",
      },
      smsNotice: "Termii SMS Mirror sent to +234 803 *** 4192 (Rural fallback active)",
    },
    {
      id: "m-5",
      sender: "Gbadamosi Lateef",
      role: "Farmer",
      initials: "GL",
      timestamp: "14:18 WAT",
      content: "Agreed. Quadri's inspection is clear. Release the operator's share and refund my balance to my Zenith account.",
    },
  ],
};

export function MessagingHub(_props: ScreenProps) {
  const [threads, setThreads] = useState<Thread[]>(INITIAL_THREADS);
  const [activeThreadId, setActiveThreadId] = useState<string>("thread-1");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);
  const [messageText, setMessageText] = useState<string>("");
  const [sendInApp, setSendInApp] = useState<boolean>(true);
  const [sendSms, setSendSms] = useState<boolean>(true);
  const [selectedLang, setSelectedLang] = useState<"EN" | "YOR" | "PID">("EN");
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [settlementExecuted, setSettlementExecuted] = useState<boolean>(false);

  // New broadcast modal state
  const [broadcastTarget, setBroadcastTarget] = useState<string>("all_farmers");
  const [broadcastMessage, setBroadcastMessage] = useState<string>("");
  const [broadcastChannel, setBroadcastChannel] = useState<string>("omnichannel");

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];
  const activeMessages = messagesMap[activeThreadId] || [];

  const filteredThreads = threads.filter((t) => {
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.subtitle.toLowerCase().includes(q) ||
        t.snippet.toLowerCase().includes(q) ||
        t.farmerName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: "Dr. Quadri Olapade (Lead Agronomist)",
      role: "Platform Agent",
      initials: "QO",
      timestamp: "Just now",
      content: messageText.trim(),
      isSelf: true,
      smsNotice: sendSms ? "Termii SMS Failover broadcast queued for rural offline numbers" : undefined,
    };

    setMessagesMap((prev) => ({
      ...prev,
      [activeThreadId]: [...(prev[activeThreadId] || []), newMsg],
    }));

    setMessageText("");
    showScreenToast(
      `Message dispatched in ${selectedLang} via ${sendInApp ? "In-App Push" : ""}${
        sendInApp && sendSms ? " & " : ""
      }${sendSms ? "Termii SMS Gateway" : ""}.`
    );
  };

  const handleExportLogs = () => {
    const csvContent =
      "Thread ID,Category,Counterparties,Booking Ref,Last Active,Escrow Ref,Status,NDPA Consent\n" +
      threads
        .map(
          (t) =>
            `"${t.id}","${t.category}","${t.title}","${t.bookingRef}","${t.time}","${t.escrowVal}","${t.status}",APPROVED`
        )
        .join("\n");

    downloadFile("cultivanode-communication-audit-log.csv", csvContent, "text/csv");
    showScreenToast("Communication & Dispatch audit logs exported to CSV.");
  };

  const handleDownloadTranscript = () => {
    const transcriptText =
      `CULTIVANODE COMMUNICATION TRANSCRIPT\n` +
      `Thread: ${activeThread.title}\nRef: ${activeThread.bookingRef}\nParcel: ${activeThread.parcel}\nDate: May 04, 2026\nNDPA 2023 Masking: Active\n\n` +
      activeMessages
        .map((m) => `[${m.timestamp}] ${m.sender} (${m.role}):\n${m.content || m.telemetryNotice || "[Voice / Media Note]"}\n`)
        .join("\n");

    downloadFile(`Transcript-${activeThread.bookingRef.replace("#", "")}.txt`, transcriptText, "text/plain");
    showScreenToast(`Transcript for ${activeThread.bookingRef} downloaded.`);
  };

  const panelPrivacyAudit = (
    <div className="w-full max-w-lg rounded-xl bg-surface-container-lowest shadow-2xl p-space-md flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-surface-container">
        <div className="flex items-center gap-2">
          <Icon name="security" className="text-primary text-xl" />
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">NDPA 2023 Privacy &amp; PII Audit</h3>
        </div>
        <ScreenDialogClose>
          <button onClick={() => {}} className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface" type="button">
            <Icon name="close" className="text-lg" />
          </button>
        </ScreenDialogClose>
      </div>
      <div className="p-3 rounded-lg bg-surface-container-low space-y-2 text-body-sm">
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Statutory Authority:</span>
          <span className="font-bold text-on-surface">Nigeria Data Protection Act (NDPA 2023)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Phone &amp; NIN Masking:</span>
          <span className="font-semibold text-secondary">Active (PBX Virtual Proxy Route)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Rural Gateway:</span>
          <span className="font-semibold text-on-surface">Termii DLR-Verified 2-Way SMS</span>
        </div>
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Cryptographic Hash Anchor:</span>
          <span className="font-mono text-xs text-primary">0x93bf481a7920cde8...771e</span>
        </div>
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Offline Cache:</span>
          <span className="font-semibold text-secondary">PowerSync AES-256 SQLite Cipher</span>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container"
          type="button"
          onClick={() => {
            downloadFile(
              "NDPA-2023-Privacy-Audit-Report.txt",
              "CULTIVANODE NDPA 2023 STATUTORY COMPLIANCE DOSSIER\nFramework: NDPA 2023 Part V (Data Protection Principles)\nPII Masking: Virtual GSM proxy enabled for all bilateral voice & text\nSupabase Vault Root: 0x93bf481a7920cde8771e\nAudit Officer: Legal & Governance Lead\nStatus: FULLY COMPLIANT",
              "text/plain"
            );
            showScreenToast("NDPA Privacy Audit Dossier downloaded.");
          }}
        >
          Download Privacy Dossier
        </button>
      </div>
    </div>
  );

  const panelNewDispatch = (
    <div className="w-full max-w-lg rounded-xl bg-surface-container-lowest shadow-2xl p-space-md flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-surface-container">
        <div className="flex items-center gap-2">
          <Icon name="campaign" className="text-primary text-xl" />
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Broadcast Agricultural Dispatch</h3>
        </div>
        <ScreenDialogClose>
          <button onClick={() => {}} className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface" type="button">
            <Icon name="close" className="text-lg" />
          </button>
        </ScreenDialogClose>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1">Target Cluster / Audience</label>
          <select
            className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-sm focus:outline-none"
            value={broadcastTarget}
            onChange={(e) => setBroadcastTarget(e.target.value)}
          >
            <option value="all_farmers">All Registered Smallholders (Oyo &amp; Osun)</option>
            <option value="iseyin_m3">Iseyin Savanna Cluster (Maize Outgrowers)</option>
            <option value="saki_west">Saki West &amp; Oke-Ogun Machinery Syndicates</option>
            <option value="horticulture">Odo-Ogun Perishable Vegetable Producers</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1">Dispatch Channels</label>
          <select
            className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-sm focus:outline-none"
            value={broadcastChannel}
            onChange={(e) => setBroadcastChannel(e.target.value)}
          >
            <option value="omnichannel">Omnichannel (In-App Push + Termii SMS Failover)</option>
            <option value="sms_only">SMS Only (Immediate rural broadcast)</option>
            <option value="voice_ivr">Voice IVR (Yorùbá Audio Call Broadcast)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1">Advisory Message Content</label>
          <textarea
            className="w-full p-2.5 rounded-lg bg-surface-container-low text-on-surface font-body-sm focus:outline-none resize-none"
            placeholder="Type emergency weather advisory or cluster instructions..."
            rows={3}
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-surface-container">
        <ScreenDialogClose>
          <button onClick={() => {}} className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md" type="button">
            Cancel
          </button>
        </ScreenDialogClose>
        <ScreenDialogClose>
          <button
            className="px-5 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container"
            type="button"
            onClick={() => {
              if (!broadcastMessage.trim()) {
                showScreenToast("Please enter an advisory message before dispatching.");
                return;
              }
              showScreenToast(`Advisory dispatched to ${broadcastTarget} via ${broadcastChannel}.`);
              setBroadcastMessage("");
            }}
          >
            Transmit Broadcast
          </button>
        </ScreenDialogClose>
      </div>
    </div>
  );

  const panelAlgorithmicSplit = (
    <div className="w-full max-w-lg rounded-xl bg-surface-container-lowest shadow-2xl p-space-md flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-surface-container">
        <div className="flex items-center gap-2">
          <Icon name="satellite_alt" className="text-secondary text-xl" />
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">PostGIS Telemetry Split Review</h3>
        </div>
        <ScreenDialogClose>
          <button onClick={() => {}} className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface" type="button">
            <Icon name="close" className="text-lg" />
          </button>
        </ScreenDialogClose>
      </div>
      <div className="p-3 rounded-lg bg-surface-container-low space-y-2 text-body-sm">
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Target Field Area:</span>
          <span className="font-semibold text-on-surface">4.50 Hectares (Plot M3)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-on-surface-variant">RTK Traversed Polygon:</span>
          <span className="font-bold text-secondary">3.82 Hectares (84.89%)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Excluded Impassable Rock:</span>
          <span className="font-bold text-error">0.68 Hectares (15.11%)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Original Segregated Escrow:</span>
          <span className="font-bold text-on-surface">₦95,000.00</span>
        </div>
        <div className="flex justify-between border-t border-surface-container pt-1.5">
          <span className="text-on-surface-variant">Operator Share (84.89%):</span>
          <span className="font-bold text-primary">₦80,645.50</span>
        </div>
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Farmer Refund (15.11%):</span>
          <span className="font-bold text-secondary">₦14,354.50</span>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <ScreenDialogClose>
          <button
            className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container"
            type="button"
            onClick={() => {
              setSettlementExecuted(true);
              showScreenToast("Algorithmic split approved and committed into Zenith Escrow engine.");
            }}
          >
            Authorize This Split
          </button>
        </ScreenDialogClose>
      </div>
    </div>
  );

  return (
    <div className="screen">
      <div className="flex flex-col w-full pb-10">
        <div className="flex flex-col gap-space-xs mb-space-md">
          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <nav className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
              <span>Platform Administration</span>
              <Icon name="chevron_right" className="text-[14px]" />
              <span>Communication &amp; Omnichannel</span>
              <Icon name="chevron_right" className="text-[14px]" />
              <span className="text-primary font-semibold">Messaging &amp; Dispatch (§12.2)</span>
            </nav>
            <div className="flex flex-wrap items-center gap-space-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <span>WebSocket Realtime (Supabase)</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm">
                <Icon name="security" className="text-[15px] text-primary" />
                <span>NDPA 2023 Masking: Active</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm">
                <Icon name="sms" className="text-[15px] text-tertiary-container" />
                <span>Termii Fallback: ₦18,420 Bal</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pt-space-xs">
            <div>
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface font-bold tracking-tight">Messaging &amp; Communication Hub</h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-4xl mt-0.5">Context-aware communication channels bound to active equipment bookings, produce offtake negotiations, field extension advisories, and dispute resolution dossiers across Oyo &amp; Osun clusters.</p>
            </div>
            <div className="flex items-center gap-space-xs shrink-0">
              <ScreenDialog title="NDPA 2023 Privacy Audit" side="center" panel={panelPrivacyAudit}>
                <button onClick={() => {}} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm hover:bg-surface-container-low transition-colors" type="button">
                  <Icon name="lock_reset" className="text-[18px]" />
                  <span>Audit Privacy</span>
                </button>
              </ScreenDialog>
              <button
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm hover:bg-surface-container-low transition-colors"
                type="button"
                onClick={handleExportLogs}
              >
                <Icon name="download" className="text-[18px]" />
                <span>Export Logs</span>
              </button>
              <ScreenDialog title="New Dispatch" side="center" panel={panelNewDispatch}>
                <button onClick={() => {}} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary-container transition-colors" type="button">
                  <Icon name="campaign" className="text-[18px]" />
                  <span>New Dispatch</span>
                </button>
              </ScreenDialog>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-sm mb-space-md">
          <div className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm text-label-sm uppercase tracking-wider">Active Threads</span>
              <Icon name="chat" className="text-[18px] text-primary" />
            </div>
            <div className="mt-space-xs flex items-baseline justify-between">
              <span className="font-metric-num text-metric-num text-on-surface">28</span>
              <span className="px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold">100% Synced</span>
            </div>
            <div className="mt-space-xs flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
              <span>12 Bookings</span>
              <span>•</span>
              <span>9 Produce</span>
              <span>•</span>
              <span>7 Advisory</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm text-label-sm uppercase tracking-wider">Urgent Escalations</span>
              <Icon name="priority_high" className="text-[18px] text-error" />
            </div>
            <div className="mt-space-xs flex items-baseline justify-between">
              <span className="font-metric-num text-metric-num text-error">7</span>
              <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">&lt; 48m SLA</span>
            </div>
            <div className="mt-space-xs text-on-surface-variant font-label-sm text-label-sm">
              <span>3 Escrow proration stalls</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm text-label-sm uppercase tracking-wider">Avg Response Time</span>
              <Icon name="timer" className="text-[18px] text-secondary" />
            </div>
            <div className="mt-space-xs flex items-baseline justify-between">
              <span className="font-metric-num text-metric-num text-on-surface">14.2<span className="text-body-sm font-normal text-on-surface-variant">m</span></span>
              <span className="text-secondary font-label-sm text-label-sm font-semibold">-3.1m vs Target</span>
            </div>
            <div className="mt-space-xs text-on-surface-variant font-label-sm text-label-sm">
              <span>Target: &lt; 30.0m operational</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm text-label-sm uppercase tracking-wider">SMS Failover Ratio</span>
              <Icon name="cell_tower" className="text-[18px] text-tertiary-container" />
            </div>
            <div className="mt-space-xs flex items-baseline justify-between">
              <span className="font-metric-num text-metric-num text-on-surface">18.4<span className="text-body-sm font-normal text-on-surface-variant">%</span></span>
              <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold">Saki &amp; Oke-Ogun</span>
            </div>
            <div className="mt-space-xs text-on-surface-variant font-label-sm text-label-sm">
              <span>Triggers if offline &gt;5 min</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm text-label-sm uppercase tracking-wider">Bilingual Precision</span>
              <Icon name="translate" className="text-[18px] text-primary" />
            </div>
            <div className="mt-space-xs flex items-baseline justify-between">
              <span className="font-metric-num text-metric-num text-on-surface">99.1<span className="text-body-sm font-normal text-on-surface-variant">%</span></span>
              <span className="text-secondary font-label-sm text-label-sm font-semibold">Yorùbá / Pidgin</span>
            </div>
            <div className="mt-space-xs text-on-surface-variant font-label-sm text-label-sm">
              <span>Neural Agronomy Lexicon</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-md items-start">
          <div className="xl:col-span-3 flex flex-col bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden">
            <div className="p-space-md flex flex-col gap-space-sm bg-surface-container-lowest border-b border-surface-container">
              <div className="relative w-full">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]" />
                <input
                  className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-sm text-body-sm focus:outline-none focus:bg-surface-container transition-colors"
                  placeholder="Search farmer, booking #, parcel..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-on-surface-variant">
                {[
                  { key: "all", label: "All (28)" },
                  { key: "bookings", label: "Bookings (12)" },
                  { key: "produce", label: "Produce (9)" },
                  { key: "advisory", label: "Advisory (4)" },
                  { key: "support", label: "Support (3)" },
                ].map((item) => (
                  <button
                    key={item.key}
                    className={`px-2.5 py-1 rounded font-label-sm text-label-sm whitespace-nowrap transition-colors ${
                      categoryFilter === item.key ? "bg-primary text-on-primary" : "hover:bg-surface-container text-on-surface-variant"
                    }`}
                    type="button"
                    onClick={() => setCategoryFilter(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col max-h-[720px] overflow-y-auto">
              {filteredThreads.map((thread) => {
                const isSelected = thread.id === activeThreadId;
                return (
                  <div
                    key={thread.id}
                    className={`p-space-sm flex flex-col gap-1.5 cursor-pointer transition-colors relative border-b border-surface-container/50 ${
                      isSelected ? "bg-surface-container-low" : "hover:bg-surface-container-low/60"
                    }`}
                    onClick={() => setActiveThreadId(thread.id)}
                  >
                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                    <div className="flex items-start justify-between gap-space-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs shrink-0">
                          {thread.initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-label-md text-label-md text-on-surface font-bold truncate">{thread.title}</span>
                          <span className="font-label-sm text-label-sm text-primary font-medium truncate">{thread.subtitle}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">{thread.time}</span>
                        {thread.unreadCount ? <span className="w-2 h-2 rounded-full bg-error mt-1" /> : null}
                      </div>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 pl-10">{thread.snippet}</p>
                    <div className="flex flex-wrap items-center gap-1.5 pl-10 pt-1">
                      {thread.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-label-sm text-[10px]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="xl:col-span-6 flex flex-col bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden">
            <div className="p-space-md bg-surface-container-lowest flex flex-col gap-space-xs border-b border-surface-container">
              <div className="flex flex-wrap items-center justify-between gap-space-sm">
                <div className="flex items-center gap-space-sm min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-sm">
                      {activeThread.operatorInitials}
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-secondary ring-2 ring-surface-container-lowest" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold truncate">{activeThread.operatorName}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary-container text-on-secondary-container font-semibold">
                        {activeThread.operatorRole}
                      </span>
                      <span className="text-on-surface-variant text-body-sm">&amp;</span>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold truncate">{activeThread.farmerName}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-surface-container-high text-on-surface font-semibold">
                        {activeThread.farmerRole}
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Saki Machinery Syndicate #04 · Field RTK Rover Active</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface transition-colors"
                    title="Call via GSM / Virtual PBX"
                    type="button"
                    onClick={() => {
                      showScreenToast(`Virtual PBX conference dialed to ${activeThread.operatorName} and ${activeThread.farmerName} (NDPA Masked).`);
                    }}
                  >
                    <Icon name="call" className="text-[18px]" />
                  </button>
                  <button
                    className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface transition-colors"
                    title="View Cadastral Map"
                    type="button"
                    onClick={() => {
                      showScreenToast(`Cadastral Map opened for ${activeThread.parcel}.`);
                    }}
                  >
                    <Icon name="map" className="text-[18px]" />
                  </button>
                  <button
                    className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-error transition-colors"
                    title="Escalate to Support"
                    type="button"
                    onClick={() => {
                      showScreenToast(`Dispute dossier drafted for ${activeThread.bookingRef}. Senior agronomist notified.`);
                    }}
                  >
                    <Icon name="gavel" className="text-[18px]" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-space-xs p-2 rounded-lg bg-surface-container-low text-on-surface font-label-sm text-label-sm mt-1">
                <div className="flex items-center gap-1.5 truncate">
                  <Icon name="link" className="text-[16px] text-primary" />
                  <span className="font-semibold text-primary">Booking {activeThread.bookingRef}:</span>
                  <span className="truncate">{activeThread.parcel}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface font-bold text-[11px] shadow-sm">
                    {activeThread.escrowVal}
                  </span>
                  <span className="text-error font-semibold text-[11px]">2h 12m cutoff</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-[11px] px-1">
                <Icon name="verified_user" className="text-[14px] text-secondary" />
                <span>End-to-end audit logged · Phone/BVN masked per NDPA 2023 · Auto SQLite sync</span>
              </div>
            </div>

            <div className="p-space-md flex flex-col gap-space-md bg-surface-container-lowest max-h-[520px] overflow-y-auto">
              <div className="flex items-center justify-center my-1">
                <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-[11px]">
                  Today · Early Rains Session · 04 May 2026
                </span>
              </div>

              {activeMessages.map((msg) => {
                if (msg.telemetryNotice) {
                  return (
                    <div key={msg.id} className="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-sm text-body-sm shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                        <Icon name="satellite_alt" className="text-[18px]" />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-label-sm text-label-sm font-bold text-primary">PostGIS Telemetry Engine · Automatic Calculation</span>
                        <p className="font-body-sm text-body-sm text-on-surface">{msg.telemetryNotice}</p>
                      </div>
                      <ScreenDialog title="Algorithmic Split" side="center" panel={panelAlgorithmicSplit}>
                        <button onClick={() => {}} className="px-2.5 py-1 rounded bg-surface-container-lowest text-primary font-label-sm text-label-sm font-semibold shadow-sm shrink-0 hover:bg-surface-container" type="button">
                          Review Algorithmic Split
                        </button>
                      </ScreenDialog>
                    </div>
                  );
                }

                if (msg.isSelf) {
                  return (
                    <div key={msg.id} className="flex items-start gap-space-sm max-w-[85%] self-end flex-row-reverse">
                      <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {msg.initials}
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-on-surface-variant">{msg.timestamp}</span>
                          <span className="font-label-sm text-label-sm font-semibold text-on-surface">{msg.sender}</span>
                        </div>
                        <div className="p-space-sm rounded-lg rounded-tr-none bg-primary text-on-primary font-body-sm text-body-sm shadow-sm flex flex-col gap-space-xs text-left">
                          <p>{msg.content}</p>
                          {msg.images && (
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              {msg.images.map((img, idx) => (
                                <div key={idx} className="rounded-lg overflow-hidden bg-primary-container p-1 flex flex-col gap-1">
                                  <img className="w-full h-24 object-cover rounded" src={img.src} alt={img.alt} loading="lazy" decoding="async" />
                                  <div className="flex flex-col text-[10px] text-on-primary-container px-1">
                                    <span className="font-semibold truncate">{img.title}</span>
                                    <span>{img.meta}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {msg.yorubaTranslation && (
                            <div
                              className="pt-1 text-[11px] text-on-primary-container flex items-center gap-1.5 cursor-pointer hover:underline"
                              onClick={() => showScreenToast("Yorùbá: " + msg.yorubaTranslation)}
                            >
                              <Icon name="translate" className="text-[14px]" />
                              <span>Yorùbá: &quot;{msg.yorubaTranslation}&quot;</span>
                            </div>
                          )}
                        </div>
                        {msg.smsNotice && <span className="text-[10px] text-on-surface-variant font-label-sm">{msg.smsNotice}</span>}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="flex items-start gap-space-sm max-w-[85%]">
                    <div className="w-7 h-7 rounded-full bg-surface-variant text-on-surface flex items-center justify-center font-bold text-xs shrink-0">
                      {msg.initials}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-label-sm text-label-sm font-semibold text-on-surface">{msg.sender}</span>
                        <span className="text-[11px] text-on-surface-variant">{msg.timestamp}</span>
                      </div>
                      <div className="p-space-sm rounded-lg rounded-tl-none bg-surface-container-low text-on-surface font-body-sm text-body-sm shadow-sm flex flex-col gap-space-xs">
                        {msg.content && <p>{msg.content}</p>}
                        {msg.audio && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-lowest shadow-sm">
                            <button
                              className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0"
                              type="button"
                              onClick={() => {
                                setIsPlayingAudio(!isPlayingAudio);
                                showScreenToast(isPlayingAudio ? "Audio playback paused." : "Playing audio voice note...");
                              }}
                            >
                              <Icon name={isPlayingAudio ? "pause_circle" : "play_arrow"} className="text-[16px]" />
                            </button>
                            <div className="flex-1 flex flex-col gap-0.5">
                              <div className="flex items-center justify-between text-[11px] font-label-sm text-on-surface-variant">
                                <span>{msg.audio.title}</span>
                                <span>{isPlayingAudio ? "0:12" : "0:00"} / {msg.audio.duration}</span>
                              </div>
                              <div className="flex items-center gap-0.5 h-3">
                                {[2, 3, 2, 3, 1.5, 3, 2, 3, 1.5, 2.5, 1.5].map((h, i) => (
                                  <span
                                    key={i}
                                    className={`w-1 rounded-full ${isPlayingAudio ? "bg-secondary animate-pulse" : "bg-primary"}`}
                                    style={{ height: `${h * 4}px` }}
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary-container/40 text-on-secondary-container font-semibold">
                              {msg.audio.lang}
                            </span>
                          </div>
                        )}
                      </div>
                      {msg.smsNotice && (
                        <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant font-label-sm">
                          <Icon name="done_all" className="text-[12px] text-tertiary-container" />
                          <span>{msg.smsNotice}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-space-md bg-surface-container-lowest flex flex-col gap-space-xs border-t border-surface-container">
              <div className="flex flex-wrap items-center justify-between gap-space-xs text-on-surface-variant">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-on-surface-variant font-label-sm text-label-sm">
                  <button
                    className="px-2 py-1 rounded bg-surface-container-high hover:bg-surface-container text-on-surface flex items-center gap-1"
                    type="button"
                    onClick={() => {
                      setMessageText("Confirmed: 84.89% prorated settlement agreed under ToS §5.4 impassable terrain clause.");
                      showScreenToast("Canned arbitration template applied.");
                    }}
                  >
                    <Icon name="quickreply" className="text-[14px]" /> Canned Templates
                  </button>
                  <button
                    className="px-2 py-1 rounded bg-surface-container-high hover:bg-surface-container text-on-surface flex items-center gap-1"
                    type="button"
                    onClick={() => {
                      setMessageText((prev) => prev + " [GPS Fix: 7.9732° N, 3.5901° E - Plot M3 Northern Edge]");
                      showScreenToast("GPS Tag inserted into message.");
                    }}
                  >
                    <Icon name="pin_drop" className="text-[14px]" /> Insert GPS Tag
                  </button>
                  <button
                    className="px-2 py-1 rounded bg-surface-container-high hover:bg-surface-container text-on-surface flex items-center gap-1"
                    type="button"
                    onClick={() => {
                      showScreenToast("PoW photo attachment simulated: Boulder_Outcrop_M3.jpg");
                    }}
                  >
                    <Icon name="photo_camera" className="text-[14px]" /> Attach PoW Photo
                  </button>
                  <button
                    className="px-2 py-1 rounded bg-surface-container-high hover:bg-surface-container text-on-surface flex items-center gap-1"
                    type="button"
                    onClick={() => {
                      showScreenToast("Recording simulated voice note in English & Yorùbá...");
                    }}
                  >
                    <Icon name="mic" className="text-[14px]" /> Record Audio Note
                  </button>
                </div>
                <div className="flex items-center bg-surface-container-low rounded p-0.5 text-on-surface-variant font-label-sm text-[11px]">
                  {(["EN", "YOR", "PID"] as const).map((lang) => (
                    <button
                      key={lang}
                      className={`px-1.5 py-0.5 rounded transition-colors ${
                        selectedLang === lang ? "bg-surface-container-lowest text-primary font-bold shadow-sm" : "hover:text-on-surface"
                      }`}
                      type="button"
                      onClick={() => {
                        setSelectedLang(lang);
                        showScreenToast(`Language switched to ${lang}. AI assistant translated.`);
                      }}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative w-full">
                <textarea
                  className="w-full p-space-sm rounded-lg bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-sm text-body-sm focus:outline-none focus:bg-surface-container transition-colors resize-none"
                  placeholder="Compose message to parties... (Press Enter to send, Shift+Enter for newline)"
                  rows={3}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-space-sm pt-1">
                <div className="flex items-center gap-space-sm text-on-surface font-label-sm text-label-sm">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      checked={sendInApp}
                      onChange={(e) => setSendInApp(e.target.checked)}
                      className="w-4 h-4 rounded text-primary accent-primary"
                      type="checkbox"
                    />
                    <span>Send In-App Push</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-on-surface-variant">
                    <input
                      checked={sendSms}
                      onChange={(e) => setSendSms(e.target.checked)}
                      className="w-4 h-4 rounded text-primary accent-primary"
                      type="checkbox"
                    />
                    <span>Termii SMS Failover (if unread in 120s)</span>
                  </label>
                </div>
                <div className="flex items-center gap-space-xs">
                  <button
                    className="px-3 py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors"
                    type="button"
                    onClick={() => {
                      showScreenToast("Message draft saved to local SQLite cache.");
                    }}
                  >
                    Save Draft
                  </button>
                  <button
                    className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary-container transition-colors"
                    type="button"
                    onClick={handleSendMessage}
                  >
                    <span>Send Message</span>
                    <Icon name="send" className="text-[16px]" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-3 flex flex-col gap-space-md">
            <div className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon name="folder_open" className="text-[18px] text-primary" />
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Linked Dossier</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-label-sm bg-secondary-container/40 text-on-secondary-container font-bold">
                  {activeThread.bookingRef}
                </span>
              </div>
              <div className="flex flex-col gap-2 pt-1 font-body-sm text-body-sm text-on-surface">
                <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                  <span>Status</span>
                  <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-semibold">{activeThread.status}</span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                  <span>Cluster Parcel</span>
                  <span className="text-on-surface font-medium truncate max-w-[160px]">{activeThread.parcel}</span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                  <span>Crop Variety</span>
                  <span className="text-on-surface font-medium">SAMMAZ-52 Maize (V4)</span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                  <span>Escrow Balance</span>
                  <span className="font-bold text-primary">{activeThread.escrowVal}</span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                  <span>Time Window</span>
                  <span className="text-on-surface font-medium">04 May, 07:00–16:00 WAT</span>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Cadastral RTK Boundary</span>
                <span className="text-[11px] font-label-sm text-secondary font-bold">84.89% Completed</span>
              </div>
              <div className="w-full h-44 rounded-lg bg-cover bg-center relative overflow-hidden shadow-sm flex flex-col justify-between p-2" data-location="Iseyin, Oyo State, Nigeria" style={{ backgroundImage: "url('/images/screens/472596272b8b.webp')" }}>
                <div className="self-start px-2 py-0.5 rounded bg-inverse-surface/80 text-inverse-on-surface text-[10px] font-mono backdrop-blur-sm">RTK-Fix ±1.4cm · Lat 7.9732° N</div>
                <div className="bg-inverse-surface/90 text-inverse-on-surface rounded p-1.5 flex items-center justify-between text-[11px] font-label-sm backdrop-blur-sm">
                  <div className="flex items-center gap-1 text-secondary-fixed">
                    <span className="w-2 h-2 rounded-full bg-secondary-fixed" />
                    <span>Traversed: 3.82 Ha</span>
                  </div>
                  <div className="flex items-center gap-1 text-error-container">
                    <span className="w-2 h-2 rounded-full bg-error" />
                    <span>Granite Risk: 0.68 Ha</span>
                  </div>
                </div>
              </div>
              <p className="font-body-sm text-[12px] text-on-surface-variant pt-1 leading-snug">Telemetry overlay cross-verified via Massey Ferguson MF 375 onboard GPS logger and Quadri Olapade&apos;s Trimble R12 rover.</p>
            </div>

            <div className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col gap-space-sm">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Counterparties</span>
              <div className="p-2 rounded bg-surface-container-low flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-bold">{activeThread.farmerName}</span>
                  <span className="font-label-sm text-[11px] text-on-surface-variant">NIN Verified · 12 Bookings Completed</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface font-label-sm text-[11px] font-bold shadow-sm">4.8 ★</span>
              </div>
              <div className="p-2 rounded bg-surface-container-low flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-bold">{activeThread.operatorName}</span>
                  <span className="font-label-sm text-[11px] text-on-surface-variant">BVN Tier-2 · Leadway Insured Fleet</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface font-label-sm text-[11px] font-bold shadow-sm">4.95 ★</span>
              </div>
              <div className="p-2.5 rounded bg-surface-container-high/40 text-on-surface flex flex-col gap-1 text-[11px] font-label-sm mt-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">NDPA 2023 Consent Status</span>
                  <span className="text-secondary font-bold">APPROVED</span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span>Identity Masking</span>
                  <span>Virtual PBX Proxied</span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span>Audit Trail Anchor</span>
                  <span className="font-mono text-[10px]">0x7b4a...92cf</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 pt-1">
                <button
                  className="w-full py-2 px-3 rounded-lg bg-tertiary-container text-on-tertiary font-label-md text-label-md shadow-sm hover:bg-tertiary transition-colors flex items-center justify-center gap-1.5"
                  type="button"
                  onClick={() => {
                    setSettlementExecuted(true);
                    showScreenToast("Prorated settlement executed: ₦80,645.50 to Operator, ₦14,354.50 refund to Farmer.");
                  }}
                >
                  <Icon name="account_balance_wallet" className="text-[16px]" />
                  <span>{settlementExecuted ? "Settlement Executed (₦95k Settled)" : "Execute Prorated Settlement"}</span>
                </button>
                <button
                  className="w-full py-1.5 px-3 rounded-lg bg-surface-container-low text-on-surface font-label-sm text-label-sm hover:bg-surface-container transition-colors flex items-center justify-center gap-1"
                  type="button"
                  onClick={handleDownloadTranscript}
                >
                  <Icon name="download" className="text-[14px]" />
                  <span>Download Chat &amp; PoW Transcript</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-space-md p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-sm text-on-surface-variant font-label-sm text-label-sm">
          <div className="flex items-center gap-space-xs max-w-4xl">
            <Icon name="policy" className="text-[20px] text-primary shrink-0" />
            <p className="font-body-sm text-[12px] text-on-surface-variant">
              <strong>Compliance Notice (§12.2):</strong> CultivaNode Communication Gateway complies with Nigeria Data Protection Act (NDPA 2023) Sections 24–34 and NCC Interconnect Regulations. Rural cellular failover routes through Termii DLR-verified gateway with cryptographic tamper-evident message hashes in Supabase Vault.
            </p>
          </div>
          <div className="flex items-center gap-space-md shrink-0">
            <div className="flex items-center gap-1 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span>PowerSync Sync: <strong>0 Pending</strong></span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono">
              <span className="text-on-surface-variant">Root:</span>
              <span className="text-primary font-bold">0x93bf...771e</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
