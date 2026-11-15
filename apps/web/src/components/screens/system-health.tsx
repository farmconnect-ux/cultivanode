"use client";

// Ported from the "super_admin_system_health_dashboard" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import { showScreenToast } from "@/components/ds/screen-dialog";
import { slot, type ScreenProps } from "./types";

export type SystemHealthSlot = "kpis" | "services" | "queue" | "ledger";

export function SystemHealth({ slots }: ScreenProps<SystemHealthSlot>) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <section className="px-space-md lg:px-margin-desktop pt-space-lg pb-space-md bg-surface-container-lowest shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col gap-space-sm">
            <div className="flex flex-wrap items-center justify-between gap-space-sm">
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm">
                <span className="hover:text-on-surface cursor-pointer">Platform Administration</span>
                <Icon name="chevron_right" className="text-sm text-outline" />
                <span className="hover:text-on-surface cursor-pointer">Infrastructure &amp; Telemetry</span>
                <Icon name="chevron_right" className="text-sm text-outline" />
                <span className="font-label-md text-label-md text-primary font-semibold">Super Admin Console</span>
                <span className="ml-2 px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">§11.1 &amp; §11.6 Spec</span>
              </nav>
              <div className="flex items-center gap-space-xs">
                <div className="flex items-center gap-2 px-space-sm py-1 rounded-full bg-secondary-container/30 text-on-secondary-container font-label-md text-label-md font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
                  </span>
                  <span>Production · West Africa Cluster (LOS / OYO)</span>
                </div>
                <span className="text-on-surface-variant font-label-sm text-label-sm">TTL 120s</span>
              </div>
            </div>
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-md pt-space-xs">
              <div className="flex flex-col gap-1 max-w-3xl min-w-0">
                <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface tracking-tight truncate">Super Admin &amp; System Health Command Center</h1>
                <p className="font-body-md text-body-md text-on-surface-variant">Global platform telemetry, multi-tenant cluster orchestration, integration uptime, verification backlogs, and tamper-evident administrative audit controls.</p>
              </div>
              <div className="flex flex-wrap items-center gap-space-xs shrink-0">
                <button onClick={() => showScreenToast("Diagnostic sweep (sample data): services responding.")} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg shadow-sm transition-all duration-150" id="btn-health-diagnostic" type="button">
                  <Icon name="vital_signs" className="text-secondary text-base" />
                  <span>Run Diagnostics</span>
                </button>
                <button onClick={() => showScreenToast("Cluster migration status: All active PostgreSQL read replicas synced. Platform lock disabled.")} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg shadow-sm transition-all duration-150" id="btn-maintenance-modal" type="button">
                  <Icon name="lock" className="text-tertiary-container text-base" />
                  <span>Platform Lock / Migration</span>
                </button>
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- downloads a file from an API route, not a page */}
                <a className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg shadow-sm transition-all duration-150" id="btn-export-audit" href="/api/account/export">
                  <Icon name="download" className="text-base" />
                  <span>Export Audit Ledger</span>
                </a>
              </div>
            </div>
          </div>
        </section>
        <div className="max-w-7xl mx-auto w-full px-space-md lg:px-margin-desktop py-space-lg flex flex-col gap-space-xl">
          {slot(slots, "kpis", (
            <section className="flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="monitoring" className="text-primary text-lg" />
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">Platform High-Level Key Performance Indicators</h2>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Telemetry Engine: 10s Poll</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-space-sm">
                <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Total Registered Users</span>
                    <Icon name="group" className="text-secondary text-lg" />
                  </div>
                  <div className="my-space-xs">
                    <div className="font-metric-num text-metric-num text-on-surface">14,820</div>
                    <div className="flex items-center gap-1 text-secondary font-label-sm text-label-sm">
                      <Icon name="arrow_upward" className="text-sm" />
                      <span>+340 this week</span>
                    </div>
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant truncate">1,420 Syndicates &amp; Farms (OYO/OGN/OSN)</p>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Mapped Farm Pins (sample)</span>
                    <Icon name="crop_free" className="text-primary text-lg" />
                  </div>
                  <div className="my-space-xs">
                    <div className="font-metric-num text-metric-num text-on-surface">38,450.5 <span className="text-label-md font-body-md text-on-surface-variant">Ha</span></div>
                    <div className="flex items-center gap-1 text-primary font-label-sm text-label-sm">
                      <Icon name="verified" className="text-sm" />
                      <span>Boundary walking coming soon</span>
                    </div>
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant truncate">Farm locations stored with PostGIS</p>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Escrow Volume (not live)</span>
                    <Icon name="payments" className="text-tertiary-container text-lg" />
                  </div>
                  <div className="my-space-xs">
                    <div className="font-metric-num text-metric-num text-on-surface">₦0<span className="text-label-md font-body-md text-on-surface-variant">M</span></div>
                    <div className="flex items-center gap-1 text-on-secondary-container font-label-sm text-label-sm">
                      <Icon name="savings" className="text-sm" />
                      <span>No platform fee on hires</span>
                    </div>
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant truncate">Waiting for a licensed payment partner</p>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Identity Review Queue</span>
                    <Icon name="pending_actions" className="text-tertiary-container text-lg" />
                  </div>
                  <div className="my-space-xs">
                    <div className="font-metric-num text-metric-num text-on-surface">18 <span className="text-label-md font-body-md text-on-surface-variant">Pending</span></div>
                    <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                      <Icon name="schedule" className="text-sm" />
                      <span>Avg res: 4.2 hrs</span>
                    </div>
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant truncate">NIN, BVN and bank checks (sample data)</p>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Open Disputes Queue</span>
                    <Icon name="gavel" className="text-error text-lg" />
                  </div>
                  <div className="my-space-xs">
                    <div className="font-metric-num text-metric-num text-on-surface">2 <span className="text-label-md font-body-md text-on-surface-variant">Cases</span></div>
                    <div className="flex items-center gap-1 text-secondary font-label-sm text-label-sm">
                      <Icon name="check_circle" className="text-sm" />
                      <span>0.41% rate (&lt;5% SLA)</span>
                    </div>
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant truncate">Proof of work coming soon</p>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Service Uptime (sample)</span>
                    <Icon name="speed" className="text-secondary text-lg" />
                  </div>
                  <div className="my-space-xs">
                    <div className="font-metric-num text-metric-num text-on-surface">99.98%</div>
                    <div className="flex items-center gap-1 text-secondary font-label-sm text-label-sm">
                      <Icon name="bolt" className="text-sm" />
                      <span>24ms avg query latency</span>
                    </div>
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant truncate">Supabase DB</p>
                </div>
              </div>
            </section>
          ))}
          {slot(slots, "services", (
            <section className="flex flex-col gap-space-sm">
              <div className="flex flex-wrap items-center justify-between gap-space-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <Icon name="hub" className="text-primary text-xl" />
                    <h2 className="font-headline-md text-headline-md text-on-surface">External Integrations &amp; Service Mesh Health Monitor (§11.6)</h2>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Real-time status, RPC latencies, and circuit breaker health across core microservices and national infrastructure APIs.</p>
                </div>
                <div className="flex items-center gap-space-xs font-label-sm text-label-sm">
                  <span className="px-2 py-1 rounded bg-secondary-container/40 text-on-secondary-container font-semibold">7 / 7 Active</span>
                  <span className="text-on-surface-variant">Zero Circuit Breakers Tripped</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-space-sm">
                <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between xl:col-span-2">
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-primary-container/20 flex items-center justify-center">
                          <Icon name="database" className="text-primary text-lg" />
                        </div>
                        <div>
                          <h3 className="font-headline-sm text-headline-sm text-on-surface">Supabase PostgreSQL &amp; PostGIS</h3>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Core Spatial Engine · Supabase hosted</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Healthy</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-space-xs">
                      <div className="p-2 rounded bg-surface-container-low">
                        <div className="font-label-sm text-label-sm text-on-surface-variant">SLA / Latency</div>
                        <div className="font-headline-sm text-headline-sm text-on-surface">99.99% <span className="font-body-sm text-body-sm text-secondary font-medium">18ms</span></div>
                      </div>
                      <div className="p-2 rounded bg-surface-container-low">
                        <div className="font-label-sm text-label-sm text-on-surface-variant">PgBouncer Pool</div>
                        <div className="font-headline-sm text-headline-sm text-on-surface">42 <span className="font-body-sm text-body-sm text-on-surface-variant">/ 120 conn</span></div>
                      </div>
                      <div className="p-2 rounded bg-surface-container-low">
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Database Size</div>
                        <div className="font-headline-sm text-headline-sm text-on-surface">18.4 <span className="font-body-sm text-body-sm text-on-surface-variant">GB</span></div>
                      </div>
                      <div className="p-2 rounded bg-surface-container-low">
                        <div className="font-label-sm text-label-sm text-on-surface-variant">PostGIS Queries</div>
                        <div className="font-headline-sm text-headline-sm text-on-surface">4.2ms <span className="font-body-sm text-body-sm text-on-surface-variant">avg</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-space-sm pt-space-xs flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm bg-surface-container-low/50 px-2 py-1 rounded">
                    <span className="flex items-center gap-1"><Icon name="shield" className="text-sm text-secondary" /> Row-Level Security (RLS) active on all 35 tables</span>
                    <span>Vault: secret_supabase_cluster_rw (Masked)</span>
                  </div>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-secondary-container/40 flex items-center justify-center">
                          <Icon name="sync" className="text-secondary text-lg" />
                        </div>
                        <div>
                          <h3 className="font-headline-sm text-headline-sm text-on-surface">Offline Sync</h3>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Coming soon (PowerSync planned)</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Planned</span>
                    </div>
                    <div className="space-y-1.5 pt-space-xs font-body-sm text-body-sm">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Field Devices</span>
                        <span className="font-semibold text-on-surface">Not live</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Synced Mutations</span>
                        <span className="font-semibold text-on-surface">Not live</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Conflict Resolution Rate</span>
                        <span className="font-semibold text-secondary">Not live</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-space-sm pt-space-xs flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>Offline mode</span>
                    <span className="text-secondary font-medium">Coming soon</span>
                  </div>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center">
                          <Icon name="badge" className="text-primary text-lg" />
                        </div>
                        <div>
                          <h3 className="font-headline-sm text-headline-sm text-on-surface">ID Check Provider</h3>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">NIN, BVN &amp; Bank Account Checks</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Online</span>
                    </div>
                    <div className="space-y-1.5 pt-space-xs font-body-sm text-body-sm">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">NIN Match Rate</span>
                        <span className="font-semibold text-secondary">Sample data</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Response Time</span>
                        <span className="font-semibold text-on-surface">1.1s avg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Daily Quota Usage</span>
                        <span className="font-semibold text-on-surface">912 / 2,400 (38%)</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-space-sm pt-space-xs flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>SLA: 99.8%</span>
                    <span className="text-primary font-medium">Masked IDs Stored</span>
                  </div>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center">
                          <Icon name="account_balance" className="text-primary text-lg" />
                        </div>
                        <div>
                          <h3 className="font-headline-sm text-headline-sm text-on-surface">Paystack &amp; Flutterwave</h3>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Marketplace Checkout (escrow not live)</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Operational</span>
                    </div>
                    <div className="space-y-1.5 pt-space-xs font-body-sm text-body-sm">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Webhook Ingestion</span>
                        <span className="font-semibold text-on-surface">99.95% (0 retry)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Escrow</span>
                        <span className="font-semibold text-secondary">Not live yet</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Bank Payout Latency</span>
                        <span className="font-semibold text-on-surface">12s median</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-space-sm pt-space-xs flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>SSL KeyPinning: OK</span>
                    <span className="text-secondary font-medium">Split Code: 0xSPLT_AGRO</span>
                  </div>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center">
                          <Icon name="sms" className="text-primary text-lg" />
                        </div>
                        <div>
                          <h3 className="font-headline-sm text-headline-sm text-on-surface">Termii Telecom Relay</h3>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">SMS (USSD planned)</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Nominal</span>
                    </div>
                    <div className="space-y-1.5 pt-space-xs font-body-sm text-body-sm">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">SMS Deliverability</span>
                        <span className="font-semibold text-on-surface">97.8% (Telco DND safe)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">OTP Delivery Time</span>
                        <span className="font-semibold text-on-surface">3.4s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">USSD</span>
                        <span className="font-semibold text-secondary">Planned</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-space-sm pt-space-xs flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>Air, MTN, Glo, 9mob</span>
                    <span className="text-secondary font-medium">Route: DND</span>
                  </div>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center">
                          <Icon name="cloudy_snowing" className="text-primary text-lg" />
                        </div>
                        <div>
                          <h3 className="font-headline-sm text-headline-sm text-on-surface">Open-Meteo Weather</h3>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Agro-Meteorological Stream</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Connected</span>
                    </div>
                    <div className="space-y-1.5 pt-space-xs font-body-sm text-body-sm">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Toposequence Grid</span>
                        <span className="font-semibold text-on-surface">1km Savanna Res</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Last Cache Refresh</span>
                        <span className="font-semibold text-on-surface">6 mins ago</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Early Warning Alert</span>
                        <span className="font-semibold text-tertiary-container">Oke-Ogun Squall Alert</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-space-sm pt-space-xs flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>Forecast Sync: Hourly</span>
                    <span className="text-secondary font-medium">WGS84 Aligned</span>
                  </div>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center">
                          <Icon name="smart_toy" className="text-primary text-lg" />
                        </div>
                        <div>
                          <h3 className="font-headline-sm text-headline-sm text-on-surface">Agronomy Vision &amp; AI</h3>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Farm assistant (photo diagnosis coming soon)</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Online</span>
                    </div>
                    <div className="space-y-1.5 pt-space-xs font-body-sm text-body-sm">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Mean Inference Latency</span>
                        <span className="font-semibold text-on-surface">420ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Photo Diagnosis</span>
                        <span className="font-semibold text-secondary">Coming soon</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Safety Guardrails</span>
                        <span className="font-semibold text-on-surface">100% (No auto DB writes)</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-space-sm pt-space-xs flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>Photo model planned</span>
                    <span className="text-primary font-medium">Read-Only Agent</span>
                  </div>
                </div>
              </div>
            </section>
          ))}
          {slot(slots, "queue", (
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
              <div className="lg:col-span-7 flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="verified_user" className="text-primary text-xl" />
                    <h2 className="font-headline-md text-headline-md text-on-surface">Verification Escalation Queue (§11.2)</h2>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface-variant font-medium">3 Pending Sign-offs</span>
                </div>
                <div className="rounded-lg bg-surface-container-lowest shadow-sm overflow-hidden flex flex-col">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">
                          <th className="py-2.5 px-space-md uppercase font-semibold">Entity / Operator</th>
                          <th className="py-2.5 px-space-md uppercase font-semibold">Tier Level &amp; Documents</th>
                          <th className="py-2.5 px-space-md uppercase font-semibold">Review State</th>
                          <th className="py-2.5 px-space-md uppercase font-semibold text-right">Administrative Action</th>
                        </tr>
                      </thead>
                      <tbody className="font-body-sm text-body-sm text-on-surface divide-y divide-surface-container-low">
                        <tr className="hover:bg-surface-container-low/40 transition-colors">
                          <td className="py-space-sm px-space-md">
                            <div className="font-semibold text-on-surface">Sample Tractor Syndicate</div>
                            <div className="text-on-surface-variant font-label-sm text-label-sm">CAC number (sample) · Iseyin Hub</div>
                          </td>
                          <td className="py-space-sm px-space-md">
                            <div className="flex items-center gap-1">
                              <span className="px-1.5 py-0.5 rounded bg-primary-container/20 text-primary font-label-sm text-label-sm font-semibold">Tier 3 Fleet</span>
                            </div>
                            <div className="text-on-surface-variant font-label-sm text-label-sm">4x MF Tractors Logged + Insurance</div>
                          </td>
                          <td className="py-space-sm px-space-md">
                            <div className="flex items-center gap-1.5 text-on-tertiary-container font-label-sm text-label-sm font-medium">
                              <span className="w-2 h-2 rounded-full bg-tertiary-container" />
                              <span>Assigned to Quadri O.</span>
                            </div>
                          </td>
                          <td className="py-space-sm px-space-md text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => showScreenToast("Inspecting Tractor Syndicate dossier (sample): 4x Massey Ferguson units, insurance document uploaded.")} className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors" type="button">Inspect</button>
                              <button onClick={() => showScreenToast("Tractor Syndicate verified: Tier 2 Fleet Operator credentials unlocked.")} className="px-2.5 py-1 rounded bg-primary-container hover:bg-primary text-on-primary font-label-sm text-label-sm transition-colors" type="button">Approve</button>
                            </div>
                          </td>
                        </tr>
                        <tr className="hover:bg-surface-container-low/40 transition-colors">
                          <td className="py-space-sm px-space-md">
                            <div className="font-semibold text-on-surface">Sample Cassava Outgrowers Cooperative</div>
                            <div className="text-on-surface-variant font-label-sm text-label-sm">82 Member Group · Oyo North</div>
                          </td>
                          <td className="py-space-sm px-space-md">
                            <div className="flex items-center gap-1">
                              <span className="px-1.5 py-0.5 rounded bg-primary-container/20 text-primary font-label-sm text-label-sm font-semibold">Tier 3 Offtaker</span>
                            </div>
                            <div className="text-on-surface-variant font-label-sm text-label-sm">Director BVN Check Passed</div>
                          </td>
                          <td className="py-space-sm px-space-md">
                            <div className="flex items-center gap-1.5 text-tertiary-container font-label-sm text-label-sm font-medium">
                              <span className="w-2 h-2 rounded-full bg-tertiary-container" />
                              <span>Bank Statement Pending</span>
                            </div>
                          </td>
                          <td className="py-space-sm px-space-md text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => showScreenToast("Inspecting cooperative documents (sample): 82 members registered, CAC registration checked.")} className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors" type="button">Inspect Docs</button>
                            </div>
                          </td>
                        </tr>
                        <tr className="hover:bg-surface-container-low/40 transition-colors">
                          <td className="py-space-sm px-space-md">
                            <div className="font-semibold text-on-surface">Sample Vet</div>
                            <div className="text-on-surface-variant font-label-sm text-label-sm">Vet licence (sample) · Saki Outpost</div>
                          </td>
                          <td className="py-space-sm px-space-md">
                            <div className="flex items-center gap-1">
                              <span className="px-1.5 py-0.5 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold">Tier 2 Licensed Vet</span>
                            </div>
                            <div className="text-on-surface-variant font-label-sm text-label-sm">Cold-chain Affidavit Uploaded</div>
                          </td>
                          <td className="py-space-sm px-space-md">
                            <div className="flex items-center gap-1.5 text-secondary font-label-sm text-label-sm font-medium">
                              <span className="w-2 h-2 rounded-full bg-secondary" />
                              <span>Ready for Approval</span>
                            </div>
                          </td>
                          <td className="py-space-sm px-space-md text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => showScreenToast("Sample Vet approved (sample data): licence document checked.")} className="px-2.5 py-1 rounded bg-primary-container hover:bg-primary text-on-primary font-label-sm text-label-sm transition-colors" type="button">Approve</button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="p-space-sm bg-surface-container-low/40 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                    <span>Automated ID checks do not cover Tier 3 corporate documents</span>
                    <span className="font-medium text-primary">SLA Max Threshold: 12 Hours</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-5 flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="balance" className="text-error text-xl" />
                    <h2 className="font-headline-md text-headline-md text-on-surface">Dispute &amp; PoW Arbitration (§11.3)</h2>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">1 Action Required</span>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col gap-space-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-headline-sm text-headline-sm text-on-surface">Case #DSP-2026-014</span>
                        <span className="px-1.5 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">Tillage &amp; Weeding</span>
                      </div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">Job #BKG-2026-0482 · Dispute Logged: 3h ago</p>
                    </div>
                    <span className="font-label-lg text-label-lg font-bold text-on-surface">₦47,000 Agreed Fee</span>
                  </div>
                  <div className="p-space-sm rounded bg-surface-container-low flex flex-col gap-1.5 font-body-sm text-body-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-on-surface">Farmer Claim: Sample Farmer</span>
                      <span className="text-on-surface-variant font-label-sm">Plot M3 (4.5 Ha Contracted)</span>
                    </div>
                    <p className="text-on-surface-variant text-xs">Farmer states operator abandoned work early, leaving 0.7 Ha uncleared in the north sector.</p>
                    <div className="flex justify-between items-center pt-1">
                      <span className="font-semibold text-on-surface">Operator Defense: Sample operator</span>
                      <span className="text-on-surface-variant font-label-sm">Photos Submitted</span>
                    </div>
                    <p className="text-on-surface-variant text-xs">Operator logged impassable natural granite boulder outcrop. Unworked boundary confirmed as hazardous to tractor implement.</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between font-label-sm text-label-sm">
                      <span className="text-on-surface-variant flex items-center gap-1"><Icon name="pin_drop" className="text-sm text-primary" /> Reported Work vs Plot Area (sample)</span>
                      <span className="font-semibold text-secondary">3.82 Ha Logged (85% of plot)</span>
                    </div>
                    <div className="w-full bg-surface-container-low h-2.5 rounded-full overflow-hidden flex">
                      <div className="bg-secondary h-full" style={{ width: "84.8%" }} title="Worked Area: 3.82 Ha" />
                      <div className="bg-error/60 h-full" style={{ width: "15.2%" }} title="Rocky Outcrop: 0.68 Ha" />
                    </div>
                    <div className="flex justify-between text-xs text-on-surface-variant">
                      <span>Verified Worked: 3.82 Ha</span>
                      <span>Rock Outcrop: 0.68 Ha Unworked</span>
                    </div>
                  </div>
                  <div className="p-space-sm rounded bg-surface-container flex flex-col gap-2">
                    <div className="flex items-center justify-between font-label-sm text-label-sm">
                      <span className="font-bold text-on-surface">Algorithmically Prorated Settlement</span>
                      <span className="text-secondary font-semibold">Proof of work coming soon</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 font-body-sm text-body-sm">
                      <div className="p-1.5 rounded bg-surface-container-lowest text-center">
                        <div className="text-xs text-on-surface-variant">Release to Operator</div>
                        <div className="font-bold text-primary">₦39,900</div>
                      </div>
                      <div className="p-1.5 rounded bg-surface-container-lowest text-center">
                        <div className="text-xs text-on-surface-variant">Refund to Farmer</div>
                        <div className="font-bold text-secondary">₦7,100</div>
                      </div>
                    </div>
                    <button onClick={() => showScreenToast("Split recorded (sample): ₦39,900 to operator, ₦7,100 not payable. Escrow is not live; the farmer pays the operator directly.")} className="w-full mt-1 py-2 px-3 rounded bg-secondary text-on-secondary font-label-lg text-label-lg font-semibold hover:bg-on-secondary-container transition-colors shadow-sm flex items-center justify-center gap-1.5" id="btn-arbitrate-action" type="button">
                      <Icon name="task_alt" className="text-base" />
                      <span>Record Prorated Split (escrow not live)</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          ))}
          {slot(slots, "ledger", (
            <section className="flex flex-col gap-space-sm">
              <div className="flex flex-wrap items-center justify-between gap-space-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <Icon name="shield_locked" className="text-primary text-xl" />
                    <h2 className="font-headline-md text-headline-md text-on-surface">Administrative Tamper-Evident Cryptographic Audit Ledger (§11.7)</h2>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Append-only immutable record of all privileged administrative state changes and escrow overrides.</p>
                </div>
                <div className="flex items-center gap-space-xs font-label-sm text-label-sm">
                  <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-semibold flex items-center gap-1"><Icon name="verified" className="text-sm text-secondary" /> Merkle Root Intact</span>
                  <span className="text-on-surface-variant">0 Broken Links Detected</span>
                </div>
              </div>
              <div className="rounded-lg bg-surface-container-lowest shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-body-sm text-body-sm">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">
                        <th className="py-2.5 px-space-md uppercase font-semibold">Timestamp (WAT)</th>
                        <th className="py-2.5 px-space-md uppercase font-semibold">Privileged Admin</th>
                        <th className="py-2.5 px-space-md uppercase font-semibold">Action &amp; Operation Type</th>
                        <th className="py-2.5 px-space-md uppercase font-semibold">Target Entity / Tenant</th>
                        <th className="py-2.5 px-space-md uppercase font-semibold">Security Details</th>
                        <th className="py-2.5 px-space-md uppercase font-semibold text-right">SHA-256 Checksum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-low text-on-surface font-body-sm">
                      <tr className="hover:bg-surface-container-low/40 transition-colors">
                        <td className="py-space-sm px-space-md font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">2026-04-20 09:58:12</td>
                        <td className="py-space-sm px-space-md">
                          <div className="font-semibold text-on-surface">sysadmin</div>
                          <div className="text-secondary font-label-sm text-label-sm">YubiKey 5C FIDO2</div>
                        </td>
                        <td className="py-space-sm px-space-md">
                          <span className="px-1.5 py-0.5 rounded bg-primary-container/20 text-primary font-label-sm text-label-sm font-semibold">RLS Policy Hot-Reload</span>
                          <div className="text-on-surface-variant font-label-sm text-label-sm">farms PostGIS bounding index rebuild</div>
                        </td>
                        <td className="py-space-sm px-space-md font-label-sm text-label-sm">Global Table: `public.farms`</td>
                        <td className="py-space-sm px-space-md font-label-sm text-label-sm text-on-surface-variant">Audit log entry (sample)</td>
                        <td className="py-space-sm px-space-md text-right font-label-sm text-label-sm font-mono text-on-surface-variant">0x8f2a...c89e</td>
                      </tr>
                      <tr className="hover:bg-surface-container-low/40 transition-colors">
                        <td className="py-space-sm px-space-md font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">2026-04-20 09:32:05</td>
                        <td className="py-space-sm px-space-md">
                          <div className="font-semibold text-on-surface">verification.officer</div>
                          <div className="text-on-surface-variant font-label-sm text-label-sm">TOTP Verified</div>
                        </td>
                        <td className="py-space-sm px-space-md">
                          <span className="px-1.5 py-0.5 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold">Tier 3 CAC Verification Approved</span>
                          <div className="text-on-surface-variant font-label-sm text-label-sm">CAC document (sample)</div>
                        </td>
                        <td className="py-space-sm px-space-md font-label-sm text-label-sm">Sample Agro-Syndicate</td>
                        <td className="py-space-sm px-space-md font-label-sm text-label-sm text-on-surface-variant">NIN check passed (sample)</td>
                        <td className="py-space-sm px-space-md text-right font-label-sm text-label-sm font-mono text-on-surface-variant">0x4e1b...902a</td>
                      </tr>
                      <tr className="hover:bg-surface-container-low/40 transition-colors">
                        <td className="py-space-sm px-space-md font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">2026-04-20 08:45:30</td>
                        <td className="py-space-sm px-space-md">
                          <div className="font-semibold text-on-surface">platform.ops</div>
                          <div className="text-on-surface-variant font-label-sm text-label-sm">Automated Health Robot</div>
                        </td>
                        <td className="py-space-sm px-space-md">
                          <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">Failover Test Passed</span>
                          <div className="text-on-surface-variant font-label-sm text-label-sm">Edge mesh sync heartbeat simulation</div>
                        </td>
                        <td className="py-space-sm px-space-md font-label-sm text-label-sm">Iseyin Local Mesh Sync Relay</td>
                        <td className="py-space-sm px-space-md font-label-sm text-label-sm text-on-surface-variant">Round-trip latency 84ms over MTN LTE</td>
                        <td className="py-space-sm px-space-md text-right font-label-sm text-label-sm font-mono text-on-surface-variant">0x3d9f...7104</td>
                      </tr>
                      <tr className="hover:bg-surface-container-low/40 transition-colors">
                        <td className="py-space-sm px-space-md font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">2026-04-20 07:15:00</td>
                        <td className="py-space-sm px-space-md">
                          <div className="font-semibold text-on-surface">Quadri Olapade (Founder)</div>
                          <div className="text-secondary font-label-sm text-label-sm">Hardware Token Signed</div>
                        </td>
                        <td className="py-space-sm px-space-md">
                          <span className="px-1.5 py-0.5 rounded bg-tertiary-container/30 text-tertiary font-label-sm text-label-sm font-semibold">Escrow Manual Hold Override (not live)</span>
                          <div className="text-on-surface-variant font-label-sm text-label-sm">Pending Field Surveyor report</div>
                        </td>
                        <td className="py-space-sm px-space-md font-label-sm text-label-sm">Job #BKG-2026-0482</td>
                        <td className="py-space-sm px-space-md font-label-sm text-label-sm text-on-surface-variant">FIDO2 Multi-Factor Signed (Dual Admin)</td>
                        <td className="py-space-sm px-space-md text-right font-label-sm text-label-sm font-mono text-on-surface-variant">0x1a7c...55e2</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="p-space-md bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-space-sm border-t border-surface-container">
                  <div className="flex items-center gap-2">
                    <Icon name="lock_clock" className="text-secondary text-base" />
                    <span className="font-label-sm text-label-sm text-on-surface font-semibold">Zero-Trust Root Architecture:</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Supabase service-role key used only on the server · Separation of Duties Protocol (§11.1) Active</span>
                  </div>
                  <div className="flex items-center gap-space-md text-on-surface-variant font-label-sm text-label-sm shrink-0">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary" /> Masked ID Numbers (NDPA 2023)</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary" /> Merkle Tree Depth: 24</span>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
