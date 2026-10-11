// Ported from the "settings_workspace_roles" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";

export function WorkspaceSettings(_props: ScreenProps) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <div className="px-margin-desktop py-space-lg flex flex-col gap-space-xl">
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
              <button className="flex items-center gap-1.5 px-space-md py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors font-label-lg text-label-lg shadow-sm" type="button">
                <Icon name="history_edu" className="text-base" />
                <span>Export Audit</span>
              </button>
              <button className="flex items-center gap-1.5 px-space-md py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors font-label-lg text-label-lg shadow-sm" type="button">
                <Icon name="rule" className="text-base" />
                <span>Request New Role</span>
              </button>
              <button className="flex items-center gap-1.5 px-space-md py-2 rounded-lg bg-primary-container text-on-primary hover:bg-primary transition-colors font-label-lg text-label-lg shadow-md" type="button">
                <Icon name="group_add" className="text-base" />
                <span>+ Invite Team Member</span>
              </button>
            </div>
          </div>
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
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface">Single-Account Multi-Role Context</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Instant operational viewport switching without multi-login friction. Roles map directly to security tokens.</p>
              </div>
              <span className="font-label-sm text-label-sm text-primary font-semibold uppercase tracking-wider">Session Token: ST-NGA-2026-X9</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
              <div className="relative p-space-md rounded-xl bg-primary-container text-on-primary shadow-md flex flex-col justify-between cursor-pointer">
                <div className="flex items-start justify-between">
                  <span className="w-9 h-9 rounded-lg bg-surface-container-lowest/15 flex items-center justify-center">
                    <Icon name="psychology_alt" className="text-xl text-secondary-fixed" />
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm font-bold">Active</span>
                </div>
                <div className="mt-4">
                  <h3 className="font-headline-sm text-headline-sm font-bold">Lead Agronomist &amp; Mgr</h3>
                  <p className="mt-1 font-body-sm text-body-sm text-on-primary-container">Full agronomic telemetry, dispatch approvals &amp; payroll signing.</p>
                </div>
                <div className="mt-4 pt-2 bg-black/10 rounded flex items-center justify-between px-2 py-1">
                  <span className="font-label-sm text-label-sm">Permissions: Unrestricted</span>
                  <Icon name="lock_open" className="text-sm" />
                </div>
              </div>
              <div className="p-space-md rounded-xl bg-surface-container-lowest hover:bg-surface-container-high transition-all shadow-sm flex flex-col justify-between cursor-pointer">
                <div className="flex items-start justify-between">
                  <span className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="precision_manufacturing" className="text-xl" />
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">Standby</span>
                </div>
                <div className="mt-4">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Machinery Syndicate</h3>
                  <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">Fleet telematics, tractor dispatch rosters, escrow claim releases.</p>
                </div>
                <div className="mt-4 pt-2 bg-surface-container-low rounded flex items-center justify-between px-2 py-1 text-on-surface-variant">
                  <span className="font-label-sm text-label-sm">₦12.5M Escrow Signing</span>
                  <Icon name="toll" className="text-sm text-tertiary" />
                </div>
              </div>
              <div className="p-space-md rounded-xl bg-surface-container-lowest hover:bg-surface-container-high transition-all shadow-sm flex flex-col justify-between cursor-pointer">
                <div className="flex items-start justify-between">
                  <span className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="storefront" className="text-xl" />
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">Standby</span>
                </div>
                <div className="mt-4">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Produce Off-taker Hub</h3>
                  <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">Aggregator bulk procurement, grading certificates &amp; logistics gates.</p>
                </div>
                <div className="mt-4 pt-2 bg-surface-container-low rounded flex items-center justify-between px-2 py-1 text-on-surface-variant">
                  <span className="font-label-sm text-label-sm">Buyer Account B2B</span>
                  <Icon name="local_shipping" className="text-sm" />
                </div>
              </div>
              <div className="p-space-md rounded-xl bg-surface-container-lowest hover:bg-surface-container-high transition-all shadow-sm flex flex-col justify-between cursor-pointer">
                <div className="flex items-start justify-between">
                  <span className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="person_pin" className="text-xl" />
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm">Queue: 4</span>
                </div>
                <div className="mt-4">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Field Agent Assisted</h3>
                  <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">Offline proxy onboarding, biometric capture &amp; audio Yoruba assist.</p>
                </div>
                <div className="mt-4 pt-2 bg-surface-container-low rounded flex items-center justify-between px-2 py-1 text-on-surface-variant">
                  <span className="font-label-sm text-label-sm">Offline Cache Ready</span>
                  <Icon name="wifi_off" className="text-sm text-secondary" />
                </div>
              </div>
              <div className="p-space-md rounded-xl bg-surface-container-lowest hover:bg-surface-container-high transition-all shadow-sm flex flex-col justify-between cursor-pointer">
                <div className="flex items-start justify-between">
                  <span className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="inventory_2" className="text-xl" />
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">Secondary</span>
                </div>
                <div className="mt-4">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Storekeeper / Silo Lead</h3>
                  <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">NPK bags, agrochemical stock audit &amp; grain hermetic bags dispatch.</p>
                </div>
                <div className="mt-4 pt-2 bg-surface-container-low rounded flex items-center justify-between px-2 py-1 text-on-surface-variant">
                  <span className="font-label-sm text-label-sm">Silo Depot Iseyin</span>
                  <Icon name="warehouse" className="text-sm" />
                </div>
              </div>
            </div>
          </div>
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
                  <input className="h-8 pl-8 pr-3 text-body-sm font-body-sm bg-surface-container-lowest rounded-lg focus:outline-none text-on-surface shadow-sm w-56" placeholder="Filter roster members..." type="text" />
                </div>
                <button className="h-8 px-3 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-high font-label-sm text-label-sm flex items-center gap-1 shadow-sm" type="button">
                  <Icon name="filter_list" className="text-base" />
                  <span>Role Filter</span>
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
                  <tr className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="px-space-md py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary text-on-primary font-bold flex items-center justify-center shrink-0">QO</div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-label-lg text-label-lg text-on-surface font-bold truncate">Quadri Olapade</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant truncate">quadri.olapade@cultivanode.ng • BVN/NIN 224***</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-space-md py-3">
                      <span className="px-2.5 py-1 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold">Owner / Lead Agro</span>
                    </td>
                    <td className="px-space-md py-3 text-body-sm font-body-sm text-on-surface">Cluster-Wide (All 42.5 Ha)</td>
                    <td className="px-space-md py-3 text-body-sm font-body-sm font-mono text-on-surface">₦50,000,000 / Day</td>
                    <td className="px-space-md py-3">
                      <div className="flex items-center gap-1.5 text-secondary font-label-sm text-label-sm font-semibold">
                        <Icon name="key" className="text-base" />
                        <span>FIDO2 WebAuthn (YubiKey)</span>
                      </div>
                    </td>
                    <td className="px-space-md py-3 text-body-sm font-body-sm text-on-surface-variant">Now (Online)</td>
                    <td className="px-space-md py-3 text-right">
                      <button className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface" type="button">
                        <Icon name="more_vert" className="text-base" />
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/60 transition-colors bg-surface-container-lowest">
                    <td className="px-space-md py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-surface-container-high text-primary font-bold flex items-center justify-center shrink-0">BG</div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-label-lg text-label-lg text-on-surface font-semibold truncate">Babatunde Gbadamosi</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant truncate">bg.syndicate@iseyin-agro.com</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-space-md py-3">
                      <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold">Machinery Lead Operator</span>
                    </td>
                    <td className="px-space-md py-3 text-body-sm font-body-sm text-on-surface">Fleet Hub &amp; Northern Plots A1–A8</td>
                    <td className="px-space-md py-3 text-body-sm font-body-sm font-mono text-on-surface">₦5,000,000 / Job</td>
                    <td className="px-space-md py-3">
                      <div className="flex items-center gap-1.5 text-secondary font-label-sm text-label-sm">
                        <Icon name="fingerprint" className="text-base" />
                        <span>Biometric Knox Enrolled</span>
                      </div>
                    </td>
                    <td className="px-space-md py-3 text-body-sm font-body-sm text-on-surface-variant">14m ago</td>
                    <td className="px-space-md py-3 text-right">
                      <button className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface" type="button">
                        <Icon name="more_vert" className="text-base" />
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="px-space-md py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-surface-container-high text-primary font-bold flex items-center justify-center shrink-0">AO</div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-label-lg text-label-lg text-on-surface font-semibold truncate">Adeleke Olusegun</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant truncate">adeleke.o@iseyin.cultivanode.ng</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-space-md py-3">
                      <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold">Field Supervisor</span>
                    </td>
                    <td className="px-space-md py-3 text-body-sm font-body-sm text-on-surface">Maize Parcels M1–M12 (24 Ha)</td>
                    <td className="px-space-md py-3 text-body-sm font-body-sm font-mono text-on-surface">₦500,000 Daily Casual Pay</td>
                    <td className="px-space-md py-3">
                      <div className="flex items-center gap-1.5 text-secondary font-label-sm text-label-sm">
                        <Icon name="lock" className="text-base" />
                        <span>Authenticator App (TOTP)</span>
                      </div>
                    </td>
                    <td className="px-space-md py-3 text-body-sm font-body-sm text-on-surface-variant">2h ago</td>
                    <td className="px-space-md py-3 text-right">
                      <button className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface" type="button">
                        <Icon name="more_vert" className="text-base" />
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="px-space-md py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-surface-container-high text-primary font-bold flex items-center justify-center shrink-0">ML</div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-label-lg text-label-lg text-on-surface font-semibold truncate">Muritala Lawal</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant truncate">muritala.mechanic@gmail.com</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-space-md py-3">
                      <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm">Mechanic / Operator</span>
                    </td>
                    <td className="px-space-md py-3 text-body-sm font-body-sm text-on-surface">Workshop Bay 2 &amp; Harvester #4</td>
                    <td className="px-space-md py-3 text-body-sm font-body-sm font-mono text-on-surface-variant">₦150,000 (Spares Requisition)</td>
                    <td className="px-space-md py-3">
                      <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm">
                        <Icon name="sms" className="text-base" />
                        <span>SMS OTP Verified</span>
                      </div>
                    </td>
                    <td className="px-space-md py-3 text-body-sm font-body-sm text-on-surface-variant">Yesterday</td>
                    <td className="px-space-md py-3 text-right">
                      <button className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface" type="button">
                        <Icon name="more_vert" className="text-base" />
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="px-space-md py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-tertiary-fixed text-tertiary font-bold flex items-center justify-center shrink-0">FA</div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-label-lg text-label-lg text-on-surface font-semibold truncate">Madam Folashade Alabi</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant truncate">folashade.silo@iseyin-coop.org</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-space-md py-3">
                      <span className="px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">Storekeeper / Silo Lead</span>
                    </td>
                    <td className="px-space-md py-3 text-body-sm font-body-sm text-on-surface">Iseyin Central Grain Silo + Chem Store</td>
                    <td className="px-space-md py-3 text-body-sm font-body-sm font-mono text-on-surface">₦2,500,000 (Waybill Inward)</td>
                    <td className="px-space-md py-3">
                      <div className="flex items-center gap-1.5 text-secondary font-label-sm text-label-sm">
                        <Icon name="key" className="text-base" />
                        <span>Passkey (Android FIDO)</span>
                      </div>
                    </td>
                    <td className="px-space-md py-3 text-body-sm font-body-sm text-on-surface-variant">3h ago</td>
                    <td className="px-space-md py-3 text-right">
                      <button className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface" type="button">
                        <Icon name="more_vert" className="text-base" />
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="px-space-md py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-surface-container-high text-primary font-bold flex items-center justify-center shrink-0">DA</div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-label-lg text-label-lg text-on-surface font-semibold truncate">Dr. K. Alabi, DVM</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant truncate">dralabi.vet@agroconsult.ng</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-space-md py-3">
                      <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm">External Agronomist/Vet</span>
                    </td>
                    <td className="px-space-md py-3 text-body-sm font-body-sm text-on-surface">Ruminant Pasture &amp; Aquaculture B</td>
                    <td className="px-space-md py-3 text-body-sm font-body-sm font-mono text-on-surface-variant">Read / Rx Prescribe Only</td>
                    <td className="px-space-md py-3">
                      <div className="flex items-center gap-1.5 text-secondary font-label-sm text-label-sm">
                        <Icon name="security" className="text-base" />
                        <span>MFA Authenticated</span>
                      </div>
                    </td>
                    <td className="px-space-md py-3 text-body-sm font-body-sm text-on-surface-variant">Apr 18, 2026</td>
                    <td className="px-space-md py-3 text-right">
                      <button className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface" type="button">
                        <Icon name="more_vert" className="text-base" />
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="px-space-md py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-surface-container-high text-primary font-bold flex items-center justify-center shrink-0">TY</div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-label-lg text-label-lg text-on-surface font-semibold truncate">Tawa Yusuf</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant truncate">crew-tawa@sms.cultivanode.internal</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-space-md py-3">
                      <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm">Casual Labour Crew Lead</span>
                    </td>
                    <td className="px-space-md py-3 text-body-sm font-body-sm text-on-surface">Weeding Sector 4 (Temporary)</td>
                    <td className="px-space-md py-3 text-body-sm font-body-sm font-mono text-on-surface-variant">Disbursement Recipient</td>
                    <td className="px-space-md py-3">
                      <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm">
                        <Icon name="phone_android" className="text-base" />
                        <span>Supervisor Proxy Biometric</span>
                      </div>
                    </td>
                    <td className="px-space-md py-3 text-body-sm font-body-sm text-on-surface-variant">6h ago</td>
                    <td className="px-space-md py-3 text-right">
                      <button className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface" type="button">
                        <Icon name="more_vert" className="text-base" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
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
                    <td className="px-2 py-3">
                      <Icon name="verified" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="verified" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="visibility" className="text-on-surface-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="visibility" className="text-on-surface-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="visibility" className="text-on-surface-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/40 bg-surface-container-low/20">
                    <td className="px-space-md py-3 text-left font-semibold text-on-surface flex items-center gap-2">
                      <Icon name="map" className="text-primary text-base" />
                      <span>Cadastral GIS &amp; Parcel Maps</span>
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="verified" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="verified" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="pin_drop" className="text-primary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="pin_drop" className="text-primary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="visibility" className="text-on-surface-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="verified" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="pin_drop" className="text-primary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/40">
                    <td className="px-space-md py-3 text-left font-semibold text-on-surface flex items-center gap-2">
                      <Icon name="grass" className="text-primary text-base" />
                      <span>Crop Phenology &amp; Scouting</span>
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="verified" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="verified" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="edit_note" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="visibility" className="text-on-surface-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="verified" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="edit_note" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/40 bg-surface-container-low/20">
                    <td className="px-space-md py-3 text-left font-semibold text-on-surface flex items-center gap-2">
                      <Icon name="pets" className="text-primary text-base" />
                      <span>Livestock &amp; Aquaculture</span>
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="verified" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="verified" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="edit_note" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="verified" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="visibility" className="text-on-surface-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/40">
                    <td className="px-space-md py-3 text-left font-semibold text-on-surface flex items-center gap-2">
                      <Icon name="calendar_month" className="text-primary text-base" />
                      <span>Field Operations &amp; Calendar</span>
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="verified" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="verified" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="edit_calendar" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="visibility" className="text-on-surface-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="visibility" className="text-on-surface-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="visibility" className="text-on-surface-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="edit_calendar" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="visibility" className="text-on-surface-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="checklist" className="text-on-surface-variant text-base" />
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/40 bg-surface-container-low/20">
                    <td className="px-space-md py-3 text-left font-semibold text-on-surface flex items-center gap-2">
                      <Icon name="agriculture" className="text-primary text-base" />
                      <span>Machinery Fleet Marketplace</span>
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="verified" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="verified" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="visibility" className="text-on-surface-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="verified" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="receipt_long" className="text-on-surface-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/40">
                    <td className="px-space-md py-3 text-left font-semibold text-on-surface flex items-center gap-2">
                      <Icon name="inventory" className="text-primary text-base" />
                      <span>Inventory &amp; Silo Stock</span>
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="verified" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="verified" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="visibility" className="text-on-surface-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="verified" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="receipt_long" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="visibility" className="text-on-surface-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/40 bg-surface-container-low/20">
                    <td className="px-space-md py-3 text-left font-semibold text-on-surface flex items-center gap-2">
                      <Icon name="account_balance" className="text-primary text-base" />
                      <span>Farm Books &amp; Accounting (₦)</span>
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="verified" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="visibility" className="text-on-surface-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="verified" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/40">
                    <td className="px-space-md py-3 text-left font-semibold text-on-surface flex items-center gap-2">
                      <Icon name="payments" className="text-primary text-base" />
                      <span>Produce &amp; Harvest Commerce</span>
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="verified" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="verified" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="visibility" className="text-on-surface-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="verified" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="visibility" className="text-on-surface-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/40 bg-surface-container-low/20">
                    <td className="px-space-md py-3 text-left font-semibold text-on-surface flex items-center gap-2">
                      <Icon name="smart_toy" className="text-primary text-base" />
                      <span>CultivaNode AI Diagnostics</span>
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="verified" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="verified" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="verified" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="verified" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="verified" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/40">
                    <td className="px-space-md py-3 text-left font-semibold text-on-surface flex items-center gap-2">
                      <Icon name="shield_person" className="text-primary text-base" />
                      <span>Settings &amp; Workspace Security</span>
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="verified" className="text-secondary text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                    <td className="px-2 py-3">
                      <Icon name="block" className="text-outline-variant text-base" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter-desktop">
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-md">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface">Security &amp; Policy Toggles</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Cluster boundary restrictions, biometric requirements, and statutory standards.</p>
              </div>
              <div className="space-y-space-md">
                <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between">
                  <div className="flex flex-col pr-2">
                    <span className="font-label-lg text-label-lg text-on-surface font-semibold">Enforce Passkey / FIDO2</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Require WebAuthn hardware token for withdrawals &gt; ₦1,000,000</span>
                  </div>
                  <div className="w-11 h-6 rounded-full bg-primary flex items-center justify-end px-0.5 cursor-pointer">
                    <div className="w-5 h-5 rounded-full bg-on-primary shadow-sm" />
                  </div>
                </div>
                <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between">
                  <div className="flex flex-col pr-2">
                    <span className="font-label-lg text-label-lg text-on-surface font-semibold">Geofenced Dispatch Check-in</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Allow field crew login only within 500m of surveyed cadastral polygon</span>
                  </div>
                  <div className="w-11 h-6 rounded-full bg-primary flex items-center justify-end px-0.5 cursor-pointer">
                    <div className="w-5 h-5 rounded-full bg-on-primary shadow-sm" />
                  </div>
                </div>
                <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between">
                  <div className="flex flex-col pr-2">
                    <span className="font-label-lg text-label-lg text-on-surface font-semibold">NDPA 2023 Compliance Mode</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Mask farmer PII and national IDs in non-managerial client apps</span>
                  </div>
                  <div className="w-11 h-6 rounded-full bg-primary flex items-center justify-end px-0.5 cursor-pointer">
                    <div className="w-5 h-5 rounded-full bg-on-primary shadow-sm" />
                  </div>
                </div>
                <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between">
                  <div className="flex flex-col pr-2">
                    <span className="font-label-lg text-label-lg text-on-surface font-semibold">PowerSync SQLite Field Cache</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Keep offline tokens signed on ruggedized field devices up to 72 hours</span>
                  </div>
                  <div className="w-11 h-6 rounded-full bg-primary flex items-center justify-end px-0.5 cursor-pointer">
                    <div className="w-5 h-5 rounded-full bg-on-primary shadow-sm" />
                  </div>
                </div>
              </div>
              <div className="mt-auto pt-space-sm flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
                <Icon name="verified" className="text-secondary text-base" />
                <span>Zero-Trust Architecture active across Oyo State cluster hubs.</span>
              </div>
            </div>
            <div className="lg:col-span-2 p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-md">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-tertiary-container text-on-tertiary font-label-sm text-label-sm uppercase font-mono">SPEC §11.7</span>
                    <h2 className="font-headline-md text-headline-md text-on-surface">Cryptographic Audit Ledger</h2>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Tamper-evident operational events cryptographically hashed with SHA-256 state chain.</p>
                </div>
                <button className="h-8 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm flex items-center gap-1 shadow-sm" type="button">
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
                <button className="font-label-sm text-label-sm text-primary font-bold hover:underline" type="button">Verify Merkle Proof →</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
