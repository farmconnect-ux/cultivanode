"use client";

// Ported from the "settings_workspace_roles" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.

import { useState, useMemo } from "react";
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogClose, showScreenToast } from "@/components/ds/screen-dialog";
import { downloadFile } from "@/lib/download";
import type { ScreenProps } from "./types";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: string;
  scope: string;
  financialCap: string;
  authMethod: string;
  authIcon: string;
  lastActive: string;
}

const INITIAL_ROSTER: TeamMember[] = [
  {
    id: "user-1",
    name: "Quadri Olapade",
    email: "quadri.olapade@cultivanode.ng • BVN/NIN 224***",
    initials: "QO",
    role: "Owner / Lead Agro",
    scope: "Cluster-Wide (All 42.5 Ha)",
    financialCap: "₦50,000,000 / Day",
    authMethod: "FIDO2 WebAuthn (YubiKey)",
    authIcon: "key",
    lastActive: "Now (Online)",
  },
  {
    id: "user-2",
    name: "Babatunde Gbadamosi",
    email: "bg.syndicate@iseyin-agro.com",
    initials: "BG",
    role: "Machinery Lead Operator",
    scope: "Fleet Hub & Northern Plots A1–A8",
    financialCap: "₦5,000,000 / Job",
    authMethod: "Biometric Knox Enrolled",
    authIcon: "fingerprint",
    lastActive: "14m ago",
  },
  {
    id: "user-3",
    name: "Adeleke Olusegun",
    email: "adeleke.o@iseyin.cultivanode.ng",
    initials: "AO",
    role: "Field Supervisor",
    scope: "Maize Parcels M1–M12 (24 Ha)",
    financialCap: "₦500,000 Daily Casual Pay",
    authMethod: "Authenticator App (TOTP)",
    authIcon: "lock",
    lastActive: "2h ago",
  },
  {
    id: "user-4",
    name: "Muritala Lawal",
    email: "muritala.mechanic@gmail.com",
    initials: "ML",
    role: "Mechanic / Operator",
    scope: "Workshop Bay 2 & Harvester #4",
    financialCap: "₦150,000 (Spares Requisition)",
    authMethod: "SMS OTP Verified",
    authIcon: "sms",
    lastActive: "Yesterday",
  },
  {
    id: "user-5",
    name: "Madam Folashade Alabi",
    email: "folashade.silo@iseyin-coop.org",
    initials: "FA",
    role: "Storekeeper / Silo Lead",
    scope: "Iseyin Central Grain Silo + Chem Store",
    financialCap: "₦2,500,000 (Waybill Inward)",
    authMethod: "Passkey (Android FIDO)",
    authIcon: "key",
    lastActive: "3h ago",
  },
  {
    id: "user-6",
    name: "Dr. K. Alabi, DVM",
    email: "dralabi.vet@agroconsult.ng",
    initials: "DA",
    role: "External Agronomist/Vet",
    scope: "Ruminant Pasture & Aquaculture B",
    financialCap: "Read / Rx Prescribe Only",
    authMethod: "MFA Authenticated",
    authIcon: "security",
    lastActive: "Apr 18, 2026",
  },
  {
    id: "user-7",
    name: "Tawa Yusuf",
    email: "crew-tawa@sms.cultivanode.internal",
    initials: "TY",
    role: "Casual Labour Crew Lead",
    scope: "Weeding Sector 4 (Temporary)",
    financialCap: "Disbursement Recipient",
    authMethod: "Supervisor Proxy Biometric",
    authIcon: "phone_android",
    lastActive: "6h ago",
  },
];

export function WorkspaceSettings(_props: ScreenProps) {
  const [activeRoleContext, setActiveRoleContext] = useState("Lead Agronomist & Mgr");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("All");

  // Modal dialog states
  const [requestRoleOpen, setRequestRoleOpen] = useState(false);
  const [inviteMemberOpen, setInviteMemberOpen] = useState(false);
  const [roleFilterModalOpen, setRoleFilterModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Policy toggles
  const [enforcePasskey, setEnforcePasskey] = useState(true);
  const [geofencedDispatch, setGeofencedDispatch] = useState(true);
  const [ndpaCompliance, setNdpaCompliance] = useState(true);
  const [powersyncCache, setPowersyncCache] = useState(true);

  // Invite member form state
  const [inviteForm, setInviteForm] = useState({
    name: "",
    emailOrPhone: "",
    role: "Field Supervisor",
    scope: "Northern Plots A1–A8",
    cap: "₦500,000",
  });

  // Filtered roster
  const filteredRoster = useMemo(() => {
    return INITIAL_ROSTER.filter((member) => {
      const matchSearch =
        searchQuery === "" ||
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.scope.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRole =
        selectedRoleFilter === "All" ||
        member.role.toLowerCase().includes(selectedRoleFilter.toLowerCase());

      return matchSearch && matchRole;
    });
  }, [searchQuery, selectedRoleFilter]);

  const handleDownloadNIBSS = (e: React.MouseEvent) => {
    e.preventDefault();
    const csvContent = `Timestamp,Actor,Action,Device,Digest\n2026-04-20 09:41:12,"Q. Olapade","Role elevated: Adeleke O. to Field Supv (Plot M1-M12)","YubiKey 5C NFC","0x7f4b892a01ce94b15cde92a401b3"\n2026-04-20 08:15:44,"B. Gbadamosi","Escrow Release Sign: N1,200,000 for Harvester Job #H-104","Samsung Knox Biometric","0x9a88c3de149fa8b88301c2901a"\n2026-04-19 16:30:02,"Folashade A.","Waybill Acceptance: 50 Bags NPK 15:15:15 to Iseyin Silo Depot","Android Passkey","0x34cc1b90f84ae7201cba09e"\n2026-04-19 11:22:18,"Q. Olapade","Policy Change: Enforce Geofenced Check-in within 500m","YubiKey 5C NFC","0xbb8019a4e92a11b83049182"\n2026-04-18 14:05:50,"Dr. K. Alabi","Prescription Log: Bio-Pesticide Neem formulation approved","TOTP MFA #449","0x09ff44a1b827e8a93108be"\n`;
    downloadFile("cultivanode-audit-ledger-nibss.csv", csvContent, "text/csv");
    showScreenToast("Audit Downloaded", "NIBSS-formatted SHA-256 tamper-evident audit ledger downloaded.");
  };

  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <div className="px-margin-desktop py-space-lg flex flex-col gap-space-xl">
          {/* Top header & main actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm tracking-wider uppercase">
                <span className="hover:text-primary transition-colors cursor-pointer">Settings &amp; Governance</span>
                <span>/</span>
                <span className="hover:text-primary transition-colors cursor-pointer">Identity &amp; Workspace Access</span>
                <span>/</span>
                <span className="text-primary font-bold">Access Matrix (§14)</span>
              </div>
              <div className="flex items-baseline gap-space-sm">
                <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface">Workspace Roles &amp; Access Governance</h1>
                <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">Postgres RLS 16.2 Enabled</span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">Multi-tenant identity lifecycle, hardware-bound cryptographic keys, and field-parcel permissions matrix tailored for Iseyin Savanna Cluster syndicates.</p>
            </div>
            <div className="flex flex-wrap items-center gap-space-sm">
              <a
                className="flex items-center gap-1.5 px-space-md py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors font-label-lg text-label-lg shadow-sm"
                href="/api/account/export"
                onClick={handleDownloadNIBSS}
              >
                <Icon name="history_edu" className="text-base" />
                <span>Export Audit</span>
              </a>
              <button
                className="flex items-center gap-1.5 px-space-md py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors font-label-lg text-label-lg shadow-sm"
                type="button"
                onClick={() => setRequestRoleOpen(true)}
              >
                <Icon name="rule" className="text-base" />
                <span>Request New Role</span>
              </button>
              <button
                className="flex items-center gap-1.5 px-space-md py-2 rounded-lg bg-primary-container text-on-primary hover:bg-primary transition-colors font-label-lg text-label-lg shadow-md"
                type="button"
                onClick={() => setInviteMemberOpen(true)}
              >
                <Icon name="group_add" className="text-base" />
                <span>+ Invite Team Member</span>
              </button>
            </div>
          </div>

          {/* Validation Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-gutter-desktop">
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Account Validation Status</span>
                <span className="w-8 h-8 rounded-lg bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed-variant">
                  <Icon name="verified_user" className="text-lg" />
                </span>
              </div>
              <div className="my-space-md">
                <div className="font-metric-num text-metric-num text-primary">Tier 3 — Syndicate</div>
                <div className="mt-1 font-body-sm text-body-sm text-on-surface-variant">CAC RC-1940822-OYO Verified</div>
              </div>
              <div className="pt-space-sm bg-surface-container-low px-space-sm py-1.5 rounded-lg flex items-center justify-between">
                <span className="font-label-xs text-label-sm text-secondary font-semibold">NIN, BVN &amp; AML Cleared</span>
                <Icon name="format_image_left" className="text-secondary text-sm" />
              </div>
            </div>
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Single-Tenant Delegations</span>
                <span className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                  <Icon name="switch_account" className="text-lg" />
                </span>
              </div>
              <div className="my-space-md">
                <div className="font-metric-num text-metric-num text-on-surface">5 Active Roles</div>
                <div className="mt-1 font-body-sm text-body-sm text-on-surface-variant">Self-Assigned / Operational Nodes</div>
              </div>
              <div className="pt-space-sm bg-surface-container-low px-space-sm py-1.5 rounded-lg flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface">Quadri Olapade (Root Mgr)</span>
                <span className="font-label-sm text-label-sm text-secondary font-bold">1 Active</span>
              </div>
            </div>
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Cluster Access Roster</span>
                <span className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                  <Icon name="groups" className="text-lg" />
                </span>
              </div>
              <div className="my-space-md">
                <div className="font-metric-num text-metric-num text-on-surface">14 Enrolled</div>
                <div className="mt-1 font-body-sm text-body-sm text-on-surface-variant">Iseyin Savanna Cluster (42.5 Ha)</div>
              </div>
              <div className="pt-space-sm bg-surface-container-low px-space-sm py-1.5 rounded-lg flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Biometric Handhelds: 8</span>
                <span className="font-label-sm text-label-sm text-primary font-bold">100% Enrolled</span>
              </div>
            </div>
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Postgres DB Policy Guard</span>
                <span className="w-8 h-8 rounded-lg bg-surface-variant flex items-center justify-center text-primary">
                  <Icon name="database" className="text-lg" />
                </span>
              </div>
              <div className="my-space-md">
                <div className="font-metric-num text-metric-num text-secondary">100% RLS Enforcement</div>
                <div className="mt-1 font-body-sm text-body-sm text-on-surface-variant">35 Supabase Tables Sandboxed</div>
              </div>
              <div className="pt-space-sm bg-surface-container-low px-space-sm py-1.5 rounded-lg flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Audit Hash Head</span>
                <span className="font-label-sm text-label-sm font-mono text-primary truncate max-w-[120px]">0x9b4a...f71e</span>
              </div>
            </div>
          </div>

          {/* Single-Account Multi-Role Context Switching */}
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface">Single-Account Multi-Role Context</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Instant operational viewport switching without multi-login friction. Roles map directly to security tokens.</p>
              </div>
              <span className="font-label-sm text-label-sm text-primary font-semibold uppercase tracking-wider">Session Token: ST-NGA-2026-X9</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
              {/* Role 1 */}
              <div
                className={`relative p-space-md rounded-xl transition-all shadow-md flex flex-col justify-between cursor-pointer ${
                  activeRoleContext === "Lead Agronomist & Mgr"
                    ? "bg-primary-container text-on-primary ring-2 ring-primary"
                    : "bg-surface-container-lowest hover:bg-surface-container-high text-on-surface"
                }`}
                onClick={() => {
                  setActiveRoleContext("Lead Agronomist & Mgr");
                  showScreenToast("Context Switched", "Active role switched to Lead Agronomist & Manager. Full telemetry enabled.");
                }}
              >
                <div className="flex items-start justify-between">
                  <span className="w-9 h-9 rounded-lg bg-surface-container-lowest/15 flex items-center justify-center">
                    <Icon name="psychology_alt" className="text-xl text-secondary-fixed" />
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm font-bold">
                    {activeRoleContext === "Lead Agronomist & Mgr" ? "Active" : "Switch"}
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="font-headline-sm text-headline-sm font-bold">Lead Agronomist &amp; Mgr</h3>
                  <p className={`mt-1 font-body-sm text-body-sm ${activeRoleContext === "Lead Agronomist & Mgr" ? "text-on-primary-container" : "text-on-surface-variant"}`}>
                    Full agronomic telemetry, dispatch approvals &amp; payroll signing.
                  </p>
                </div>
                <div className={`mt-4 pt-2 rounded flex items-center justify-between px-2 py-1 ${activeRoleContext === "Lead Agronomist & Mgr" ? "bg-black/10" : "bg-surface-container-low"}`}>
                  <span className="font-label-sm text-label-sm">Permissions: Unrestricted</span>
                  <Icon name="lock_open" className="text-sm" />
                </div>
              </div>

              {/* Role 2 */}
              <div
                className={`p-space-md rounded-xl transition-all shadow-sm flex flex-col justify-between cursor-pointer ${
                  activeRoleContext === "Machinery Syndicate"
                    ? "bg-primary-container text-on-primary ring-2 ring-primary"
                    : "bg-surface-container-lowest hover:bg-surface-container-high text-on-surface"
                }`}
                onClick={() => {
                  setActiveRoleContext("Machinery Syndicate");
                  showScreenToast("Context Switched", "Active role switched to Machinery Syndicate. Fleet dispatch & escrow active.");
                }}
              >
                <div className="flex items-start justify-between">
                  <span className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="precision_manufacturing" className="text-xl" />
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                    {activeRoleContext === "Machinery Syndicate" ? "Active" : "Standby"}
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="font-headline-sm text-headline-sm font-semibold">Machinery Syndicate</h3>
                  <p className={`mt-1 font-body-sm text-body-sm ${activeRoleContext === "Machinery Syndicate" ? "text-on-primary-container" : "text-on-surface-variant"}`}>
                    Fleet telematics, tractor dispatch rosters, escrow claim releases.
                  </p>
                </div>
                <div className={`mt-4 pt-2 rounded flex items-center justify-between px-2 py-1 ${activeRoleContext === "Machinery Syndicate" ? "bg-black/10" : "bg-surface-container-low text-on-surface-variant"}`}>
                  <span className="font-label-sm text-label-sm">₦12.5M Escrow Signing</span>
                  <Icon name="toll" className="text-sm text-tertiary" />
                </div>
              </div>

              {/* Role 3 */}
              <div
                className={`p-space-md rounded-xl transition-all shadow-sm flex flex-col justify-between cursor-pointer ${
                  activeRoleContext === "Produce Off-taker Hub"
                    ? "bg-primary-container text-on-primary ring-2 ring-primary"
                    : "bg-surface-container-lowest hover:bg-surface-container-high text-on-surface"
                }`}
                onClick={() => {
                  setActiveRoleContext("Produce Off-taker Hub");
                  showScreenToast("Context Switched", "Active role switched to Produce Off-taker Hub. B2B contracts & logistics gates active.");
                }}
              >
                <div className="flex items-start justify-between">
                  <span className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="storefront" className="text-xl" />
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                    {activeRoleContext === "Produce Off-taker Hub" ? "Active" : "Standby"}
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="font-headline-sm text-headline-sm font-semibold">Produce Off-taker Hub</h3>
                  <p className={`mt-1 font-body-sm text-body-sm ${activeRoleContext === "Produce Off-taker Hub" ? "text-on-primary-container" : "text-on-surface-variant"}`}>
                    Aggregator bulk procurement, grading certificates &amp; logistics gates.
                  </p>
                </div>
                <div className={`mt-4 pt-2 rounded flex items-center justify-between px-2 py-1 ${activeRoleContext === "Produce Off-taker Hub" ? "bg-black/10" : "bg-surface-container-low text-on-surface-variant"}`}>
                  <span className="font-label-sm text-label-sm">Buyer Account B2B</span>
                  <Icon name="local_shipping" className="text-sm" />
                </div>
              </div>

              {/* Role 4 */}
              <div
                className={`p-space-md rounded-xl transition-all shadow-sm flex flex-col justify-between cursor-pointer ${
                  activeRoleContext === "Field Agent Assisted"
                    ? "bg-primary-container text-on-primary ring-2 ring-primary"
                    : "bg-surface-container-lowest hover:bg-surface-container-high text-on-surface"
                }`}
                onClick={() => {
                  setActiveRoleContext("Field Agent Assisted");
                  showScreenToast("Context Switched", "Active role switched to Field Agent Assisted. Offline Yoruba & biometric assist ready.");
                }}
              >
                <div className="flex items-start justify-between">
                  <span className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="person_pin" className="text-xl" />
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm">
                    {activeRoleContext === "Field Agent Assisted" ? "Active" : "Queue: 4"}
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="font-headline-sm text-headline-sm font-semibold">Field Agent Assisted</h3>
                  <p className={`mt-1 font-body-sm text-body-sm ${activeRoleContext === "Field Agent Assisted" ? "text-on-primary-container" : "text-on-surface-variant"}`}>
                    Offline proxy onboarding, biometric capture &amp; audio Yoruba assist.
                  </p>
                </div>
                <div className={`mt-4 pt-2 rounded flex items-center justify-between px-2 py-1 ${activeRoleContext === "Field Agent Assisted" ? "bg-black/10" : "bg-surface-container-low text-on-surface-variant"}`}>
                  <span className="font-label-sm text-label-sm">Offline Cache Ready</span>
                  <Icon name="wifi_off" className="text-sm text-secondary" />
                </div>
              </div>

              {/* Role 5 */}
              <div
                className={`p-space-md rounded-xl transition-all shadow-sm flex flex-col justify-between cursor-pointer ${
                  activeRoleContext === "Storekeeper / Silo Lead"
                    ? "bg-primary-container text-on-primary ring-2 ring-primary"
                    : "bg-surface-container-lowest hover:bg-surface-container-high text-on-surface"
                }`}
                onClick={() => {
                  setActiveRoleContext("Storekeeper / Silo Lead");
                  showScreenToast("Context Switched", "Active role switched to Storekeeper / Silo Lead. Grain and agrochem ledger active.");
                }}
              >
                <div className="flex items-start justify-between">
                  <span className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="inventory_2" className="text-xl" />
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                    {activeRoleContext === "Storekeeper / Silo Lead" ? "Active" : "Secondary"}
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="font-headline-sm text-headline-sm font-semibold">Storekeeper / Silo Lead</h3>
                  <p className={`mt-1 font-body-sm text-body-sm ${activeRoleContext === "Storekeeper / Silo Lead" ? "text-on-primary-container" : "text-on-surface-variant"}`}>
                    NPK bags, agrochemical stock audit &amp; grain hermetic bags dispatch.
                  </p>
                </div>
                <div className={`mt-4 pt-2 rounded flex items-center justify-between px-2 py-1 ${activeRoleContext === "Storekeeper / Silo Lead" ? "bg-black/10" : "bg-surface-container-low text-on-surface-variant"}`}>
                  <span className="font-label-sm text-label-sm">Silo Depot Iseyin</span>
                  <Icon name="warehouse" className="text-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Cluster Team Directory Table */}
          <div className="rounded-xl bg-surface-container-lowest shadow-sm flex flex-col overflow-hidden">
            <div className="p-space-md bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-sm">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary">
                  <Icon name="badge" className="text-lg" />
                </div>
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface">Cluster Team &amp; Farm Permissions Directory</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Granular scoping by cadastral parcel boundary, financial escrow caps, and hardware passkeys.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Icon name="search" className="text-on-surface-variant absolute left-2.5 top-2 text-base" />
                  <input
                    className="h-8 pl-8 pr-3 text-body-sm font-body-sm bg-surface-container-lowest rounded-lg focus:outline-none text-on-surface shadow-sm w-56"
                    placeholder="Filter roster members..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  className="h-8 px-3 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-high font-label-sm text-label-sm flex items-center gap-1 shadow-sm"
                  type="button"
                  onClick={() => setRoleFilterModalOpen(true)}
                >
                  <Icon name="filter_list" className="text-base" />
                  <span>Role: {selectedRoleFilter}</span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body-md text-body-md">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                    <th className="px-space-md py-space-sm">User &amp; Identity</th>
                    <th className="px-space-md py-space-sm">Primary System Role</th>
                    <th className="px-space-md py-space-sm">Enterprise / Plot Scope</th>
                    <th className="px-space-md py-space-sm">Financial Cap (₦)</th>
                    <th className="px-space-md py-space-sm">2FA &amp; Device Trust</th>
                    <th className="px-space-md py-space-sm">Last Active</th>
                    <th className="px-space-md py-space-sm text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {filteredRoster.map((member) => (
                    <tr key={member.id} className="hover:bg-surface-container-low/60 transition-colors">
                      <td className="px-space-md py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary text-on-primary font-bold flex items-center justify-center shrink-0">
                            {member.initials}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-label-lg text-label-lg text-on-surface font-bold truncate">{member.name}</span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant truncate">{member.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-space-md py-3">
                        <span className="px-2.5 py-1 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold">
                          {member.role}
                        </span>
                      </td>
                      <td className="px-space-md py-3 text-body-sm font-body-sm text-on-surface">{member.scope}</td>
                      <td className="px-space-md py-3 text-body-sm font-body-sm font-mono text-on-surface">{member.financialCap}</td>
                      <td className="px-space-md py-3">
                        <div className="flex items-center gap-1.5 text-secondary font-label-sm text-label-sm font-semibold">
                          <Icon name={member.authIcon as any} className="text-base" />
                          <span>{member.authMethod}</span>
                        </div>
                      </td>
                      <td className="px-space-md py-3 text-body-sm font-body-sm text-on-surface-variant">{member.lastActive}</td>
                      <td className="px-space-md py-3 text-right">
                        <button
                          className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface"
                          type="button"
                          title="Manage User Permissions"
                          onClick={() => setSelectedMember(member)}
                        >
                          <Icon name="more_vert" className="text-base" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* System Permissions Matrix Table SPEC §14 */}
          <div className="rounded-xl bg-surface-container-lowest shadow-sm flex flex-col overflow-hidden">
            <div className="p-space-md bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-primary text-on-primary font-label-sm text-label-sm uppercase font-mono">SPEC §14</span>
                  <h2 className="font-headline-md text-headline-md text-on-surface">System Permissions Matrix &amp; Feature Rights</h2>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Matrix mapping between Core Subsystems and Agro-roles. Enforced via Supabase Postgres row-level policies.</p>
              </div>
              <div className="flex items-center gap-space-sm">
                <div className="flex items-center gap-1.5 text-body-sm font-body-sm">
                  <span className="w-3 h-3 rounded-full bg-secondary" />
                  <span className="font-label-sm text-label-sm text-on-surface">Full</span>
                </div>
                <div className="flex items-center gap-1.5 text-body-sm font-body-sm">
                  <span className="w-3 h-3 rounded-full bg-surface-container-high" />
                  <span className="font-label-sm text-label-sm text-on-surface">Scoped</span>
                </div>
                <div className="flex items-center gap-1.5 text-body-sm font-body-sm">
                  <span className="w-3 h-3 rounded-full bg-surface-variant" />
                  <span className="font-label-sm text-label-sm text-on-surface">Read</span>
                </div>
                <div className="flex items-center gap-1.5 text-body-sm font-body-sm">
                  <span className="w-3 h-3 rounded-full bg-error-container" />
                  <span className="font-label-sm text-label-sm text-on-surface">Locked</span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-center font-body-sm text-body-sm border-collapse">
                <thead>
                  <tr className="bg-surface-container text-on-surface font-label-sm text-label-sm uppercase">
                    <th className="px-space-md py-3 text-left font-bold w-64">OS Subsystem / Module</th>
                    <th className="px-2 py-3 font-semibold">Owner</th>
                    <th className="px-2 py-3 font-semibold">Farm Mgr</th>
                    <th className="px-2 py-3 font-semibold">Field Supv</th>
                    <th className="px-2 py-3 font-semibold">Operator</th>
                    <th className="px-2 py-3 font-semibold">Storekeeper</th>
                    <th className="px-2 py-3 font-semibold">Accountant</th>
                    <th className="px-2 py-3 font-semibold">Agro / Vet</th>
                    <th className="px-2 py-3 font-semibold">Field Agent</th>
                    <th className="px-2 py-3 font-semibold">Casual Hand</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low text-center">
                  <tr className="hover:bg-surface-container-low/40">
                    <td className="px-space-md py-3 text-left font-semibold text-on-surface flex items-center gap-2">
                      <Icon name="dashboard" className="text-primary text-base" />
                      <span>Executive Overview</span>
                    </td>
                    <td className="px-2 py-3"><Icon name="verified" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="verified" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="visibility" className="text-on-surface-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="visibility" className="text-on-surface-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="visibility" className="text-on-surface-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/40 bg-surface-container-low/20">
                    <td className="px-space-md py-3 text-left font-semibold text-on-surface flex items-center gap-2">
                      <Icon name="map" className="text-primary text-base" />
                      <span>Cadastral GIS &amp; Parcel Maps</span>
                    </td>
                    <td className="px-2 py-3"><Icon name="verified" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="verified" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="pin_drop" className="text-primary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="pin_drop" className="text-primary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="visibility" className="text-on-surface-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="verified" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="pin_drop" className="text-primary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/40">
                    <td className="px-space-md py-3 text-left font-semibold text-on-surface flex items-center gap-2">
                      <Icon name="grass" className="text-primary text-base" />
                      <span>Crop Phenology &amp; Scouting</span>
                    </td>
                    <td className="px-2 py-3"><Icon name="verified" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="verified" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="edit_note" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="visibility" className="text-on-surface-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="verified" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="edit_note" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/40 bg-surface-container-low/20">
                    <td className="px-space-md py-3 text-left font-semibold text-on-surface flex items-center gap-2">
                      <Icon name="pets" className="text-primary text-base" />
                      <span>Livestock &amp; Aquaculture</span>
                    </td>
                    <td className="px-2 py-3"><Icon name="verified" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="verified" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="edit_note" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="verified" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="visibility" className="text-on-surface-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/40">
                    <td className="px-space-md py-3 text-left font-semibold text-on-surface flex items-center gap-2">
                      <Icon name="calendar_month" className="text-primary text-base" />
                      <span>Field Operations &amp; Calendar</span>
                    </td>
                    <td className="px-2 py-3"><Icon name="verified" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="verified" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="edit_calendar" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="visibility" className="text-on-surface-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="visibility" className="text-on-surface-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="visibility" className="text-on-surface-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="edit_calendar" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="visibility" className="text-on-surface-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="checklist" className="text-on-surface-variant text-base" /></td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/40 bg-surface-container-low/20">
                    <td className="px-space-md py-3 text-left font-semibold text-on-surface flex items-center gap-2">
                      <Icon name="agriculture" className="text-primary text-base" />
                      <span>Machinery Fleet Marketplace</span>
                    </td>
                    <td className="px-2 py-3"><Icon name="verified" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="verified" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="visibility" className="text-on-surface-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="verified" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="receipt_long" className="text-on-surface-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/40">
                    <td className="px-space-md py-3 text-left font-semibold text-on-surface flex items-center gap-2">
                      <Icon name="inventory" className="text-primary text-base" />
                      <span>Inventory &amp; Silo Stock</span>
                    </td>
                    <td className="px-2 py-3"><Icon name="verified" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="verified" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="visibility" className="text-on-surface-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="verified" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="receipt_long" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="visibility" className="text-on-surface-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/40 bg-surface-container-low/20">
                    <td className="px-space-md py-3 text-left font-semibold text-on-surface flex items-center gap-2">
                      <Icon name="account_balance" className="text-primary text-base" />
                      <span>Farm Books &amp; Accounting (₦)</span>
                    </td>
                    <td className="px-2 py-3"><Icon name="verified" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="visibility" className="text-on-surface-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="verified" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/40">
                    <td className="px-space-md py-3 text-left font-semibold text-on-surface flex items-center gap-2">
                      <Icon name="payments" className="text-primary text-base" />
                      <span>Produce &amp; Harvest Commerce</span>
                    </td>
                    <td className="px-2 py-3"><Icon name="verified" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="verified" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="visibility" className="text-on-surface-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="verified" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="visibility" className="text-on-surface-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/40 bg-surface-container-low/20">
                    <td className="px-space-md py-3 text-left font-semibold text-on-surface flex items-center gap-2">
                      <Icon name="smart_toy" className="text-primary text-base" />
                      <span>CultivaNode AI Diagnostics</span>
                    </td>
                    <td className="px-2 py-3"><Icon name="verified" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="verified" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="verified" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="verified" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="verified" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/40">
                    <td className="px-space-md py-3 text-left font-semibold text-on-surface flex items-center gap-2">
                      <Icon name="shield_person" className="text-primary text-base" />
                      <span>Settings &amp; Workspace Security</span>
                    </td>
                    <td className="px-2 py-3"><Icon name="verified" className="text-secondary text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                    <td className="px-2 py-3"><Icon name="block" className="text-outline-variant text-base" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Tier Cards Row */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-gutter-desktop">
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm font-bold uppercase text-on-surface-variant">Tier 0</span>
                  <span className="w-6 h-6 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed-variant">
                    <Icon name="check" className="text-sm" />
                  </span>
                </div>
                <h3 className="mt-2 font-headline-sm text-headline-sm text-on-surface">Phone OTP</h3>
                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">Basic SMS or USSD enrollment via Nigerian carrier (+234 SIM bound).</p>
                <div className="mt-4 space-y-1.5 text-body-sm font-body-sm text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <Icon name="check_circle" className="text-sm text-secondary" />
                    <span>Local Parcel Scouting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="check_circle" className="text-sm text-secondary" />
                    <span>USSD Offline Sync</span>
                  </div>
                  <div className="flex items-center gap-2 text-outline">
                    <Icon name="cancel" className="text-sm" />
                    <span>Financial Escrow Payouts</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-space-sm bg-surface-container-low p-2 rounded-lg text-center font-label-sm text-label-sm text-secondary font-bold">Active Baseline</div>
            </div>
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm font-bold uppercase text-on-surface-variant">Tier 1</span>
                  <span className="w-6 h-6 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed-variant">
                    <Icon name="check" className="text-sm" />
                  </span>
                </div>
                <h3 className="mt-2 font-headline-sm text-headline-sm text-on-surface">NIN Biometric</h3>
                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">National Identity Management Commission (NIMC) vNIN verified.</p>
                <div className="mt-4 space-y-1.5 text-body-sm font-body-sm text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <Icon name="check_circle" className="text-sm text-secondary" />
                    <span>Plot Ownership Attribution</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="check_circle" className="text-sm text-secondary" />
                    <span>Fertilizer Subsidy Registry</span>
                  </div>
                  <div className="flex items-center gap-2 text-outline">
                    <Icon name="cancel" className="text-sm" />
                    <span>Bulk Commercial Contracts</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-space-sm bg-surface-container-low p-2 rounded-lg text-center font-label-sm text-label-sm text-secondary font-bold">Verified on File</div>
            </div>
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm font-bold uppercase text-on-surface-variant">Tier 2</span>
                  <span className="w-6 h-6 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed-variant">
                    <Icon name="check" className="text-sm" />
                  </span>
                </div>
                <h3 className="mt-2 font-headline-sm text-headline-sm text-on-surface">BVN + Bank Payout</h3>
                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">NIBSS-linked automated settlement account for machinery &amp; grain trade.</p>
                <div className="mt-4 space-y-1.5 text-body-sm font-body-sm text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <Icon name="check_circle" className="text-sm text-secondary" />
                    <span>Daily Escrow to ₦5,000,000</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="check_circle" className="text-sm text-secondary" />
                    <span>Automated Paystack/Nibss Rails</span>
                  </div>
                  <div className="flex items-center gap-2 text-outline">
                    <Icon name="cancel" className="text-sm" />
                    <span>Syndicate Fleet Collateral</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-space-sm bg-surface-container-low p-2 rounded-lg text-center font-label-sm text-label-sm text-secondary font-bold">Verified on File</div>
            </div>
            <div className="p-space-lg rounded-xl bg-primary-container text-on-primary shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm font-bold uppercase text-secondary-fixed">Tier 3</span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm font-bold">Current</span>
                </div>
                <h3 className="mt-2 font-headline-sm text-headline-sm text-on-primary font-bold">CAC + PoW Syndicate</h3>
                <p className="mt-1 font-body-sm text-body-sm text-on-primary-container">Corporate Affairs Commission entity with 5+ audited field harvest completions.</p>
                <div className="mt-4 space-y-1.5 text-body-sm font-body-sm text-on-primary-container">
                  <div className="flex items-center gap-2">
                    <Icon name="check_circle" className="text-sm text-secondary-fixed" />
                    <span className="text-on-primary">Uncapped ₦ Escrow Approvals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="check_circle" className="text-sm text-secondary-fixed" />
                    <span className="text-on-primary">Syndicate Multi-Tractor Roster</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="check_circle" className="text-sm text-secondary-fixed" />
                    <span className="text-on-primary">Cross-Border Grain Off-take</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-space-sm bg-black/20 p-2 rounded-lg text-center font-label-sm text-label-sm text-secondary-fixed font-bold">RC-1940822-OYO Bound</div>
            </div>
          </div>

          {/* Security & Policy Toggles + Cryptographic Audit Ledger */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter-desktop">
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-md">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface">Security &amp; Policy Toggles</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Cluster boundary restrictions, biometric requirements, and statutory standards.</p>
              </div>
              <div className="space-y-space-md">
                {/* Toggle 1 */}
                <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between">
                  <div className="flex flex-col pr-2">
                    <span className="font-label-lg text-label-lg text-on-surface font-semibold">Enforce Passkey / FIDO2</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Require WebAuthn hardware token for withdrawals &gt; ₦1,000,000</span>
                  </div>
                  <div
                    className={`w-11 h-6 rounded-full flex items-center px-0.5 cursor-pointer transition-colors ${
                      enforcePasskey ? "bg-primary justify-end" : "bg-surface-container-highest justify-start"
                    }`}
                    onClick={() => {
                      setEnforcePasskey(!enforcePasskey);
                      showScreenToast(
                        "Policy Toggled",
                        `FIDO2 WebAuthn requirement ${!enforcePasskey ? "ENFORCED" : "DEACTIVATED"} for large disbursements.`
                      );
                    }}
                  >
                    <div className="w-5 h-5 rounded-full bg-on-primary shadow-sm" />
                  </div>
                </div>

                {/* Toggle 2 */}
                <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between">
                  <div className="flex flex-col pr-2">
                    <span className="font-label-lg text-label-lg text-on-surface font-semibold">Geofenced Dispatch Check-in</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Allow field crew login only within 500m of surveyed cadastral polygon</span>
                  </div>
                  <div
                    className={`w-11 h-6 rounded-full flex items-center px-0.5 cursor-pointer transition-colors ${
                      geofencedDispatch ? "bg-primary justify-end" : "bg-surface-container-highest justify-start"
                    }`}
                    onClick={() => {
                      setGeofencedDispatch(!geofencedDispatch);
                      showScreenToast(
                        "Policy Toggled",
                        `Geofenced check-in ${!geofencedDispatch ? "ARMED" : "UNLOCKED"} for field crews.`
                      );
                    }}
                  >
                    <div className="w-5 h-5 rounded-full bg-on-primary shadow-sm" />
                  </div>
                </div>

                {/* Toggle 3 */}
                <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between">
                  <div className="flex flex-col pr-2">
                    <span className="font-label-lg text-label-lg text-on-surface font-semibold">NDPA 2023 Compliance Mode</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Mask farmer PII and national IDs in non-managerial client apps</span>
                  </div>
                  <div
                    className={`w-11 h-6 rounded-full flex items-center px-0.5 cursor-pointer transition-colors ${
                      ndpaCompliance ? "bg-primary justify-end" : "bg-surface-container-highest justify-start"
                    }`}
                    onClick={() => {
                      setNdpaCompliance(!ndpaCompliance);
                      showScreenToast(
                        "Policy Toggled",
                        `Nigeria Data Protection Act mode ${!ndpaCompliance ? "STRICT" : "STANDARD"}.`
                      );
                    }}
                  >
                    <div className="w-5 h-5 rounded-full bg-on-primary shadow-sm" />
                  </div>
                </div>

                {/* Toggle 4 */}
                <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between">
                  <div className="flex flex-col pr-2">
                    <span className="font-label-lg text-label-lg text-on-surface font-semibold">PowerSync SQLite Field Cache</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Keep offline tokens signed on ruggedized field devices up to 72 hours</span>
                  </div>
                  <div
                    className={`w-11 h-6 rounded-full flex items-center px-0.5 cursor-pointer transition-colors ${
                      powersyncCache ? "bg-primary justify-end" : "bg-surface-container-highest justify-start"
                    }`}
                    onClick={() => {
                      setPowersyncCache(!powersyncCache);
                      showScreenToast(
                        "Policy Toggled",
                        `Offline PowerSync token caching ${!powersyncCache ? "EXTENDED (72H)" : "REDUCED (24H)"}.`
                      );
                    }}
                  >
                    <div className="w-5 h-5 rounded-full bg-on-primary shadow-sm" />
                  </div>
                </div>
              </div>
              <div className="mt-auto pt-space-sm flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
                <Icon name="verified" className="text-secondary text-base" />
                <span>Zero-Trust Architecture active across Oyo State cluster hubs.</span>
              </div>
            </div>

            {/* Cryptographic Audit Ledger */}
            <div className="lg:col-span-2 p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-md">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-tertiary-container text-on-tertiary font-label-sm text-label-sm uppercase font-mono">SPEC §11.7</span>
                    <h2 className="font-headline-md text-headline-md text-on-surface">Cryptographic Audit Ledger</h2>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Tamper-evident operational events cryptographically hashed with SHA-256 state chain.</p>
                </div>
                <button
                  className="h-8 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm flex items-center gap-1 shadow-sm transition-colors"
                  type="button"
                  onClick={handleDownloadNIBSS}
                >
                  <Icon name="download" className="text-base" />
                  <span>Download CSV (NIBSS Format)</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body-sm text-body-sm">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                      <th className="px-3 py-2">Timestamp (WAT)</th>
                      <th className="px-3 py-2">Actor Identity</th>
                      <th className="px-3 py-2">Action Description</th>
                      <th className="px-3 py-2">Device / Auth Method</th>
                      <th className="px-3 py-2">Ledger Digest</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-low">
                    <tr className="hover:bg-surface-container-low/50 font-mono text-xs">
                      <td className="px-3 py-2.5 text-on-surface whitespace-nowrap">2026-04-20 09:41:12</td>
                      <td className="px-3 py-2.5 text-primary font-sans font-semibold">Q. Olapade</td>
                      <td className="px-3 py-2.5 text-on-surface font-sans">Role elevated: Adeleke O. to Field Supv (Plot M1–M12)</td>
                      <td className="px-3 py-2.5 text-on-surface-variant font-sans">YubiKey 5C NFC</td>
                      <td className="px-3 py-2.5 text-secondary truncate max-w-[110px]" title="0x7f4b892a01ce94b15cde92a401b3">0x7f4b...01b3</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 font-mono text-xs">
                      <td className="px-3 py-2.5 text-on-surface whitespace-nowrap">2026-04-20 08:15:44</td>
                      <td className="px-3 py-2.5 text-primary font-sans font-semibold">B. Gbadamosi</td>
                      <td className="px-3 py-2.5 text-on-surface font-sans">Escrow Release Sign: ₦1,200,000 for Harvester Job #H-104</td>
                      <td className="px-3 py-2.5 text-on-surface-variant font-sans">Samsung Knox Biometric</td>
                      <td className="px-3 py-2.5 text-secondary truncate max-w-[110px]" title="0x9a88c3de149fa8b88301c2901a">0x9a88...01a</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 font-mono text-xs">
                      <td className="px-3 py-2.5 text-on-surface whitespace-nowrap">2026-04-19 16:30:02</td>
                      <td className="px-3 py-2.5 text-primary font-sans font-semibold">Folashade A.</td>
                      <td className="px-3 py-2.5 text-on-surface font-sans">Waybill Acceptance: 50 Bags NPK 15:15:15 to Iseyin Silo Depot</td>
                      <td className="px-3 py-2.5 text-on-surface-variant font-sans">Android Passkey</td>
                      <td className="px-3 py-2.5 text-secondary truncate max-w-[110px]" title="0x34cc1b90f84ae7201cba09e">0x34cc...09e</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 font-mono text-xs">
                      <td className="px-3 py-2.5 text-on-surface whitespace-nowrap">2026-04-19 11:22:18</td>
                      <td className="px-3 py-2.5 text-primary font-sans font-semibold">Q. Olapade</td>
                      <td className="px-3 py-2.5 text-on-surface font-sans">Policy Change: Enforce Geofenced Check-in within 500m</td>
                      <td className="px-3 py-2.5 text-on-surface-variant font-sans">YubiKey 5C NFC</td>
                      <td className="px-3 py-2.5 text-secondary truncate max-w-[110px]" title="0xbb8019a4e92a11b83049182">0xbb80...182</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 font-mono text-xs">
                      <td className="px-3 py-2.5 text-on-surface whitespace-nowrap">2026-04-18 14:05:50</td>
                      <td className="px-3 py-2.5 text-primary font-sans font-semibold">Dr. K. Alabi</td>
                      <td className="px-3 py-2.5 text-on-surface font-sans">Prescription Log: Bio-Pesticide Neem formulation approved</td>
                      <td className="px-3 py-2.5 text-on-surface-variant font-sans">TOTP MFA #449</td>
                      <td className="px-3 py-2.5 text-secondary truncate max-w-[110px]" title="0x09ff44a1b827e8a93108be">0x09ff...8be</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-space-md pt-space-sm flex items-center justify-between bg-surface-container-low px-3 py-2 rounded-lg">
                <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
                  <Icon name="lock" className="text-base text-secondary" />
                  <span>Cryptographic Merkle Root: 0x9b4ae1c098df...verified across 3 decentralized cluster validator nodes.</span>
                </div>
                <button
                  type="button"
                  className="font-label-sm text-label-sm text-primary font-bold hover:underline"
                  onClick={() => showScreenToast("Merkle Proof Verified", "JSON-LD cryptographic signature verified against Sovereign Root #FG-AGR-881.")}
                >
                  Verify Merkle Proof →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal: Request New Role */}
        {requestRoleOpen && (
          <ScreenDialog
            title="Request Role Delegation &amp; Scope Expansion"
            subtitle="Submit request for temporary or permanent operational permissions under ToS §14"
            onClose={() => setRequestRoleOpen(false)}
            panel={
              <div className="flex flex-col gap-space-md">
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Target Role</label>
                  <select className="w-full bg-surface-container-low rounded-lg p-2.5 font-body-sm text-body-sm text-on-surface border border-outline-variant">
                    <option>Storekeeper &amp; Silo Manager</option>
                    <option>Machinery Syndicate Lead Dispatcher</option>
                    <option>Agronomic Chemical Application Signer</option>
                    <option>Financial Escrow Secondary Co-Signer</option>
                  </select>
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Business Justification</label>
                  <textarea
                    rows={3}
                    placeholder="Provide operational reason, parcel identifiers, and duration required..."
                    className="w-full bg-surface-container-low rounded-lg p-2.5 font-body-sm text-body-sm text-on-surface border border-outline-variant"
                  />
                </div>
                <div className="flex justify-end gap-space-sm pt-space-xs">
                  <ScreenDialogClose onClick={() => setRequestRoleOpen(false)}>Cancel</ScreenDialogClose>
                  <button
                    type="button"
                    className="px-space-md py-2 bg-primary text-on-primary font-label-md text-label-md rounded-lg font-bold hover:bg-primary-container transition-colors shadow-sm"
                    onClick={() => {
                      setRequestRoleOpen(false);
                      showScreenToast("Request Submitted", "Role expansion request submitted to Root Workspace Manager for cryptographic sign-off.");
                    }}
                  >
                    Submit Role Request
                  </button>
                </div>
              </div>
            }
          />
        )}

        {/* Modal: Invite Team Member */}
        {inviteMemberOpen && (
          <ScreenDialog
            title="Invite New Team Member / Co-op Operator"
            subtitle="Issue cryptographic onboarding passkey or SMS OTP token"
            onClose={() => setInviteMemberOpen(false)}
            panel={
              <div className="flex flex-col gap-space-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Full Legal Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Kolawole Ajayi"
                      className="w-full bg-surface-container-low rounded-lg p-2.5 font-body-sm text-body-sm text-on-surface border border-outline-variant"
                      value={inviteForm.name}
                      onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Email or +234 Mobile Phone</label>
                    <input
                      type="text"
                      placeholder="+234 803 000 0000"
                      className="w-full bg-surface-container-low rounded-lg p-2.5 font-body-sm text-body-sm text-on-surface border border-outline-variant"
                      value={inviteForm.emailOrPhone}
                      onChange={(e) => setInviteForm({ ...inviteForm, emailOrPhone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Primary Role</label>
                    <select
                      className="w-full bg-surface-container-low rounded-lg p-2.5 font-body-sm text-body-sm text-on-surface border border-outline-variant"
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    >
                      <option>Field Supervisor</option>
                      <option>Machinery Operator</option>
                      <option>Storekeeper</option>
                      <option>Casual Labour Crew Lead</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Plot / Parcel Scope</label>
                    <input
                      type="text"
                      className="w-full bg-surface-container-low rounded-lg p-2.5 font-body-sm text-body-sm text-on-surface border border-outline-variant"
                      value={inviteForm.scope}
                      onChange={(e) => setInviteForm({ ...inviteForm, scope: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Financial Escrow Cap</label>
                    <input
                      type="text"
                      className="w-full bg-surface-container-low rounded-lg p-2.5 font-body-sm text-body-sm text-on-surface border border-outline-variant"
                      value={inviteForm.cap}
                      onChange={(e) => setInviteForm({ ...inviteForm, cap: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-space-sm pt-space-xs">
                  <ScreenDialogClose onClick={() => setInviteMemberOpen(false)}>Cancel</ScreenDialogClose>
                  <button
                    type="button"
                    className="px-space-md py-2 bg-primary text-on-primary font-label-md text-label-md rounded-lg font-bold hover:bg-primary-container transition-colors shadow-sm"
                    onClick={() => {
                      setInviteMemberOpen(false);
                      showScreenToast(
                        "Invitation Dispatched",
                        `Invitation with USSD onboarding code (*384*#) dispatched to ${inviteForm.name || "team member"}.`
                      );
                    }}
                  >
                    Send Invitation
                  </button>
                </div>
              </div>
            }
          />
        )}

        {/* Modal: Role Filter */}
        {roleFilterModalOpen && (
          <ScreenDialog
            title="Filter Roster by System Role"
            subtitle="Display cluster staff according to active operational assignment"
            onClose={() => setRoleFilterModalOpen(false)}
            panel={
              <div className="flex flex-col gap-space-sm">
                {["All", "Lead Agro", "Machinery", "Supervisor", "Mechanic", "Storekeeper", "Vet", "Crew Lead"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`p-2.5 rounded-lg text-left font-label-md text-label-md transition-colors ${
                      selectedRoleFilter === r
                        ? "bg-primary text-on-primary font-bold"
                        : "bg-surface-container-low hover:bg-surface-container text-on-surface"
                    }`}
                    onClick={() => {
                      setSelectedRoleFilter(r);
                      setRoleFilterModalOpen(false);
                      showScreenToast("Filter Applied", `Showing roster members with role matching "${r}".`);
                    }}
                  >
                    {r === "All" ? "All Roles (Full Directory)" : r}
                  </button>
                ))}
              </div>
            }
          />
        )}

        {/* Modal: Manage Selected Member Permissions */}
        {selectedMember && (
          <ScreenDialog
            title={`Manage User: ${selectedMember.name}`}
            subtitle={`${selectedMember.role} · ${selectedMember.email}`}
            onClose={() => setSelectedMember(null)}
            panel={
              <div className="flex flex-col gap-space-md font-body-sm text-body-sm">
                <div className="p-space-md bg-surface-container-low rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Cadastral Scope:</span>
                    <span className="font-bold text-on-surface">{selectedMember.scope}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Financial Escrow Cap:</span>
                    <span className="font-bold text-primary">{selectedMember.financialCap}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Authentication Device:</span>
                    <span className="font-semibold text-secondary">{selectedMember.authMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Last Session Pulse:</span>
                    <span className="text-on-surface">{selectedMember.lastActive}</span>
                  </div>
                </div>
                <div className="flex justify-between gap-space-sm pt-space-xs">
                  <button
                    type="button"
                    className="px-space-md py-1.5 bg-error text-on-error font-label-md text-label-md rounded-lg font-semibold hover:bg-error/90 transition-colors"
                    onClick={() => {
                      showScreenToast("Access Revoked", `Revoked access keys for ${selectedMember.name}. Token revoked on ChirpStack and Postgres.`);
                      setSelectedMember(null);
                    }}
                  >
                    Revoke Token
                  </button>
                  <div className="flex gap-space-sm">
                    <ScreenDialogClose onClick={() => setSelectedMember(null)}>Close</ScreenDialogClose>
                    <button
                      type="button"
                      className="px-space-md py-1.5 bg-primary text-on-primary font-label-md text-label-md rounded-lg font-semibold hover:bg-primary-container transition-colors"
                      onClick={() => {
                        showScreenToast("Permissions Saved", `Updated access scope saved for ${selectedMember.name}.`);
                        setSelectedMember(null);
                      }}
                    >
                      Save Scope
                    </button>
                  </div>
                </div>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
