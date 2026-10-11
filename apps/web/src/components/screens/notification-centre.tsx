// Ported from the "unified_notification_centre" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import { slot, type ScreenProps } from "./types";

export type NotificationCentreSlot = "actions" | "kpis" | "filters" | "stream" | "statusBar";

export function NotificationCentre({ slots }: ScreenProps<NotificationCentreSlot>) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-space-md mb-space-md bg-surface-container-low px-space-md py-space-sm rounded-lg shadow-sm">
          <div className="flex flex-wrap items-center gap-space-sm text-label-sm font-label-sm text-on-surface-variant">
            <div className="flex items-center gap-space-xs text-primary font-semibold">
              <Icon name="notifications_active" className="text-[16px]" />
              <span>Unified Notification Centre (§12.1)</span>
            </div>
            <span>/</span>
            <span>Communication &amp; Omnichannel Operations</span>
            <span>/</span>
            <span className="bg-surface-container px-space-xs py-0.5 rounded text-on-surface font-semibold">Iseyin Savanna Cluster · Oyo Zone</span>
          </div>
          <div className="flex flex-wrap items-center gap-space-md mt-space-xs md:mt-0">
            <div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-sm py-1 rounded text-label-sm font-label-sm shadow-sm">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="text-on-surface font-semibold">Telemetry: 5s Polling</span>
            </div>
            <div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-sm py-1 rounded text-label-sm font-label-sm shadow-sm">
              <Icon name="verified_user" className="text-primary text-[15px]" />
              <span className="text-on-surface font-semibold">NDPA 2023 Masking: Active</span>
            </div>
            <div className="flex items-center gap-space-xs bg-secondary-container px-space-sm py-1 rounded text-on-secondary-container text-label-sm font-label-sm font-bold">
              <Icon name="sync_saved_locally" className="text-[15px]" />
              <span>PowerSync Engine SQLite Synced</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mb-space-lg">
          <div>
            <div className="flex items-center gap-space-sm">
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight">Notification Command &amp; Multi-Channel Dispatch</h1>
              <span className="bg-error-container text-on-error-container font-label-md text-label-md px-space-sm py-0.5 rounded-full font-bold">3 High Severity</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">Real-time multi-channel broadcast engine servicing 42.5 Ha Iseyin Agronomic Cluster, syndicate machinery CAN-bus, and escrow release telemetry.</p>
          </div>
          {slot(slots, "actions", (
            <div className="flex flex-wrap items-center gap-space-sm">
              <button className="flex items-center gap-space-xs bg-surface-container-lowest text-on-surface hover:bg-surface-container-high px-space-md py-2 rounded-lg font-label-md text-label-md shadow-sm transition-colors" type="button">
                <Icon name="done_all" className="text-[18px]" />
                <span>Mark All Read</span>
              </button>
              <button className="flex items-center gap-space-xs bg-surface-container-lowest text-on-surface hover:bg-surface-container-high px-space-md py-2 rounded-lg font-label-md text-label-md shadow-sm transition-colors" type="button">
                <Icon name="checklist" className="text-[18px]" />
                <span>Batch Acknowledge</span>
              </button>
              <button className="flex items-center gap-space-xs bg-tertiary-container text-on-tertiary hover:bg-tertiary px-space-md py-2 rounded-lg font-label-md text-label-md shadow-sm transition-colors font-bold" type="button">
                <Icon name="emergency_share" className="text-[18px]" />
                <span>Dispatch Emergency Agronomy Alert</span>
              </button>
            </div>
          ))}
        </div>
        {slot(slots, "kpis", (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-gutter mb-space-xl">
            <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between mb-space-xs">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Active Unread Alerts</span>
                <span className="p-1.5 rounded-md bg-error-container text-on-error-container">
                  <Icon name="priority_high" className="text-[18px]" />
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-metric-num text-metric-num text-on-surface">12</span>
                  <span className="font-label-sm text-label-sm text-error font-semibold">3 High Sev</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  <span>5 Operational · 4 Info</span>
                </div>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full mt-space-sm overflow-hidden flex">
                <div className="bg-error h-full" style={{ width: "25%" }} />
                <div className="bg-tertiary-container h-full" style={{ width: "42%" }} />
                <div className="bg-secondary h-full" style={{ width: "33%" }} />
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between mb-space-xs">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Multi-Channel Delivery</span>
                <span className="p-1.5 rounded-md bg-secondary-container text-on-secondary-container">
                  <Icon name="satellite_alt" className="text-[18px]" />
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-metric-num text-metric-num text-primary">99.4%</span>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold">+0.3% vs Wk 15</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 truncate">In-App, Termii, Push, Hooks</p>
              </div>
              <div className="mt-space-sm">
                <svg className="w-full h-4 text-secondary" fill="none" preserveAspectRatio="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 100 20">
                  <path d="M0 16 L20 14 L40 18 L60 9 L80 11 L100 4" />
                </svg>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between mb-space-xs">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Escrow SLA Response</span>
                <span className="p-1.5 rounded-md bg-surface-container-low text-primary">
                  <Icon name="timer" className="text-[18px]" />
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-metric-num text-metric-num text-on-surface">18.2m</span>
                  <span className="font-label-sm text-label-sm text-secondary font-bold">Fast</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Under 45m statutory SLA limit</p>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full mt-space-sm overflow-hidden">
                <div className="bg-primary h-full" style={{ width: "40.4%" }} />
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between mb-space-xs">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Emergency Agronomist</span>
                <span className="p-1.5 rounded-md bg-tertiary-fixed text-on-tertiary-fixed">
                  <Icon name="campaign" className="text-[18px]" />
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-metric-num text-metric-num text-tertiary-container">2</span>
                  <span className="font-label-sm text-label-sm text-tertiary-container font-semibold">Active Cycle</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Armyworm &amp; Flash Squall</p>
              </div>
              <div className="mt-space-sm flex items-center gap-1 text-label-sm font-label-sm text-on-surface font-semibold">
                <Icon name="check_circle" className="text-[14px] text-secondary" />
                <span>Broadcast Reach: 100%</span>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between mb-space-xs">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Termii SMS Gateway</span>
                <span className="p-1.5 rounded-md bg-surface-container text-on-surface">
                  <Icon name="sms" className="text-[18px]" />
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-metric-num text-metric-num text-on-surface">98.7%</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">1,420 sent</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Oyo &amp; Ogun cluster routes</p>
              </div>
              <div className="mt-space-sm flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant">
                <span>Balance: ₦18,420</span>
                <span className="text-secondary font-semibold">1.8s Latency</span>
              </div>
            </div>
          </div>
        ))}
        {slot(slots, "filters", (
          <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm mb-space-lg flex flex-col gap-space-md">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md">
              <div className="flex flex-wrap items-center gap-1 bg-surface-container-low p-1 rounded-lg">
                <button className="px-space-sm py-1.5 rounded-md bg-primary text-on-primary font-label-md text-label-md font-semibold transition-all shadow-sm" type="button">All Notifications (48)</button>
                <button className="px-space-sm py-1.5 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-label-md text-label-md transition-all" type="button">Farm Ops &amp; Phenology (14)</button>
                <button className="px-space-sm py-1.5 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-label-md text-label-md transition-all" type="button">Weather &amp; Risk (6)</button>
                <button className="px-space-sm py-1.5 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-label-md text-label-md transition-all" type="button">Escrow &amp; PoW (8)</button>
                <button className="px-space-sm py-1.5 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-label-md text-label-md transition-all" type="button">Inventory (5)</button>
                <button className="px-space-sm py-1.5 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-label-md text-label-md transition-all" type="button">Security &amp; KYC (9)</button>
                <button className="px-space-sm py-1.5 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-label-md text-label-md transition-all" type="button">AI Agronomy (6)</button>
              </div>
              <div className="flex flex-wrap items-center gap-space-xs text-label-sm font-label-sm">
                <div className="flex items-center gap-1.5 px-space-sm py-1 bg-secondary-container text-on-secondary-container rounded-full font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  <span>In-App Push (Active)</span>
                </div>
                <div className="flex items-center gap-1.5 px-space-sm py-1 bg-surface-container text-on-surface rounded-full font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  <span>Termii SMS (Online)</span>
                </div>
                <div className="flex items-center gap-1.5 px-space-sm py-1 bg-surface-container-high text-on-surface-variant rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-outline" />
                  <span>WhatsApp Pilot (Phase 1.5)</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-space-sm pt-space-xs">
              <div className="relative w-full sm:w-96">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]" />
                <input className="w-full h-9 pl-9 pr-3 rounded-md bg-surface-container-low text-on-surface text-body-sm font-body-sm focus:outline-none focus:bg-surface-container transition-colors" placeholder="Filter by Parcel (e.g. Plot M2), Booking #, or Keyword..." type="text" />
              </div>
              <div className="flex items-center gap-space-sm w-full sm:w-auto justify-end">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Sort:</span>
                <button className="flex items-center gap-1 font-label-sm text-label-sm font-semibold text-primary bg-surface-container-low px-space-sm py-1.5 rounded-md" type="button">
                  <span>Highest Severity First</span>
                  <Icon name="expand_more" className="text-[16px]" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {slot(slots, "stream", (
          <div className="flex flex-col gap-space-md mb-space-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <Icon name="stream" className="text-primary text-[20px]" />
                <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">Active Critical &amp; Operational Stream</h2>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Live streaming via Supabase Realtime (WebSocket 38ms)</span>
            </div>
            <div className="bg-surface-container-lowest rounded-lg p-space-md lg:p-space-lg shadow-sm relative overflow-hidden transition-all hover:shadow-md">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-error" />
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-space-md">
                <div className="flex items-start gap-space-md flex-1">
                  <div className="w-12 h-12 rounded-lg bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                    <Icon name="thunderstorm" className="text-[26px]" />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-space-xs">
                      <span className="px-2 py-0.5 rounded bg-error text-on-error font-label-sm text-label-sm font-bold tracking-wider uppercase">Critical Severity</span>
                      <span className="px-2 py-0.5 rounded bg-surface-container-low text-primary font-label-sm text-label-sm font-semibold">Weather &amp; Agronomy Engine</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">· 14:12 WAT (18m ago)</span>
                      <span className="bg-surface-container px-2 py-0.5 rounded text-on-surface font-label-sm text-label-sm">NiMet Doppler Auto-Trigger</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">Flash Squall &amp; Heavy Downpour Alert: Plot M2 &amp; M4 Nitrogen Leaching Hazard</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">NiMet Saki Doppler radar indicates <strong className="text-on-surface font-semibold">48mm/hr precipitation</strong> inbound within 3 hours over the Iseyin Cluster (Maize V4 Stage). Nitrogen top-dressing holding lock has been automatically triggered to prevent nutrient runoff and economic loss.</p>
                    <div className="flex flex-wrap items-center gap-space-md mt-space-xs font-label-sm text-label-sm text-on-surface-variant">
                      <div className="flex items-center gap-1">
                        <Icon name="location_on" className="text-[16px] text-primary" />
                        <span>Affected: Plot M2 (14.2 Ha) &amp; Plot M4 (8.1 Ha)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="water_drop" className="text-[16px] text-error" />
                        <span>Projected Soil Saturation: 94%</span>
                      </div>
                      <div className="flex items-center gap-1 text-secondary font-semibold">
                        <Icon name="lock_clock" className="text-[16px]" />
                        <span>Fertilization Auto-Lock Active</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap lg:flex-col gap-space-xs shrink-0 items-stretch lg:min-w-[210px]">
                  <button className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 bg-primary text-on-primary hover:bg-primary-container px-space-md py-2 rounded-lg font-label-md text-label-md font-semibold shadow-sm transition-colors" type="button">
                    <Icon name="event_busy" className="text-[18px]" />
                    <span>Postpone Top-Dress</span>
                  </button>
                  <button className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 bg-surface-container-low text-on-surface hover:bg-surface-container-high px-space-md py-2 rounded-lg font-label-md text-label-md font-semibold transition-colors" type="button">
                    <Icon name="send_to_mobile" className="text-[18px]" />
                    <span>Notify Workers via SMS</span>
                  </button>
                  <button className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 text-on-surface-variant hover:text-primary px-space-md py-1.5 rounded-lg font-label-sm text-label-sm transition-colors" type="button">
                    <Icon name="radar" className="text-[16px]" />
                    <span>View Doppler Radar</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-lg p-space-md lg:p-space-lg shadow-sm relative overflow-hidden transition-all hover:shadow-md">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-tertiary-container" />
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-space-md">
                <div className="flex items-start gap-space-md flex-1">
                  <div className="w-12 h-12 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                    <Icon name="account_balance_wallet" className="text-[26px]" />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-space-xs">
                      <span className="px-2 py-0.5 rounded bg-tertiary-container text-on-tertiary font-label-sm text-label-sm font-bold tracking-wider uppercase">Escrow SLA Warning</span>
                      <span className="px-2 py-0.5 rounded bg-surface-container-low text-primary font-label-sm text-label-sm font-semibold">Machinery &amp; Escrow PoW</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">· 14:02 WAT (28m ago)</span>
                      <span className="bg-error-container text-on-error-container px-2 py-0.5 rounded font-label-sm text-label-sm font-bold flex items-center gap-1">
                        <Icon name="alarm" className="text-[14px]" />
                        <span>Cutoff: 18:30 WAT (2h 18m remaining)</span>
                      </span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">Escrow Auto-Release Window Closing: Booking #BKG-2026-0492 Rotary Weeding</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">Contractor Muritala Lawal submitted GPS Proof-of-Work polygon (18.5 Ha completed). Statutory 48-hour counterparty review window lapses today. Unless an extension is filed, smart contract escrow releases <strong className="text-on-surface font-semibold">₦95,000.00</strong> to the operator bank account.</p>
                    <div className="flex flex-wrap items-center gap-space-md mt-space-xs font-label-sm text-label-sm text-on-surface-variant">
                      <div className="flex items-center gap-1">
                        <Icon name="badge" className="text-[16px] text-primary" />
                        <span>Syndicate Operator: Muritala Lawal (Verified Tier-2)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="polyline" className="text-[16px] text-secondary" />
                        <span>PoW Boundary Match: 99.1% verified</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="payments" className="text-[16px] text-on-surface" />
                        <span className="font-semibold text-on-surface">Escrow Locked: ₦95,000.00</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap lg:flex-col gap-space-xs shrink-0 items-stretch lg:min-w-[210px]">
                  <button className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 bg-primary text-on-primary hover:bg-primary-container px-space-md py-2 rounded-lg font-label-md text-label-md font-semibold shadow-sm transition-colors" type="button">
                    <Icon name="verified" className="text-[18px]" />
                    <span>Authorize Payout (₦95k)</span>
                  </button>
                  <button className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 bg-surface-container-low text-on-surface hover:bg-surface-container-high px-space-md py-2 rounded-lg font-label-md text-label-md font-semibold transition-colors" type="button">
                    <Icon name="more_time" className="text-[18px]" />
                    <span>Request 24h Extension</span>
                  </button>
                  <button className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 text-on-surface-variant hover:text-primary px-space-md py-1.5 rounded-lg font-label-sm text-label-sm transition-colors" type="button">
                    <Icon name="map" className="text-[16px]" />
                    <span>Inspect PoW Dossier</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-lg p-space-md lg:p-space-lg shadow-sm relative overflow-hidden transition-all hover:shadow-md">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-tertiary-fixed-dim" />
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-space-md">
                <div className="flex items-start gap-space-md flex-1">
                  <div className="w-12 h-12 rounded-lg bg-surface-container text-on-surface flex items-center justify-center shrink-0">
                    <Icon name="inventory_2" className="text-[26px]" />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-space-xs">
                      <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold uppercase tracking-wider">Inventory Warning</span>
                      <span className="px-2 py-0.5 rounded bg-surface-container-low text-primary font-label-sm text-label-sm font-semibold">Storekeeper Subsystem</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">· 11:45 WAT (2h 45m ago)</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">Critical Fertilizer Stockout: NPK 15:15:15 (Central Warehouse Oke-Ogun)</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">Stock balance has depleted to <strong className="text-error font-semibold">6 bags</strong> (50kg each). Agronomic calendar dictates Stage 2 top-dressing for 12.0 Ha of Early Rains Maize within 4 days, requiring minimum <strong className="text-on-surface font-semibold">24 bags</strong>. Shortfall: 18 bags.</p>
                    <div className="flex flex-wrap items-center gap-space-md mt-space-xs font-label-sm text-label-sm text-on-surface-variant">
                      <div className="flex items-center gap-1">
                        <Icon name="warehouse" className="text-[16px] text-primary" />
                        <span>Hub: Oke-Ogun Agronomic Depot</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="production_quantity_limits" className="text-[16px] text-tertiary-container" />
                        <span>Stock On Hand: 300 kg / Required: 1,200 kg</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap lg:flex-col gap-space-xs shrink-0 items-stretch lg:min-w-[210px]">
                  <button className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 bg-primary text-on-primary hover:bg-primary-container px-space-md py-2 rounded-lg font-label-md text-label-md font-semibold shadow-sm transition-colors" type="button">
                    <Icon name="post_add" className="text-[18px]" />
                    <span>Create Requisition PO</span>
                  </button>
                  <button className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 bg-surface-container-low text-on-surface hover:bg-surface-container-high px-space-md py-2 rounded-lg font-label-md text-label-md font-semibold transition-colors" type="button">
                    <Icon name="storefront" className="text-[18px]" />
                    <span>Check Agro-dealers</span>
                  </button>
                  <button className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 text-on-surface-variant hover:text-primary px-space-md py-1.5 rounded-lg font-label-sm text-label-sm transition-colors" type="button">
                    <Icon name="snooze" className="text-[16px]" />
                    <span>Snooze 12 Hours</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-lg p-space-md lg:p-space-lg shadow-sm relative overflow-hidden transition-all hover:shadow-md">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-tertiary" />
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-space-md">
                <div className="flex items-start gap-space-md flex-1">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center shrink-0">
                    <Icon name="agriculture" className="text-[26px]" />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-space-xs">
                      <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-bold uppercase tracking-wider">Fleet Telemetry Alarm</span>
                      <span className="px-2 py-0.5 rounded bg-surface-container-low text-primary font-label-sm text-label-sm font-semibold">Asset CAN-Bus Telematics</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">· 10:18 WAT (4h 12m ago)</span>
                      <span className="bg-error-container text-on-error-container px-2 py-0.5 rounded font-label-sm text-label-sm font-bold">102°C Overheat</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">MF 375 Tractor Overheat &amp; Boundary Breach: Asset #TRC-04 at Saki West Parcel</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">CAN-Bus diagnostic sensor logged coolant temp of <strong className="text-error font-semibold">102°C</strong> under heavy tillage load. Concurrently, GPS telemetry marks machine operating <strong className="text-on-surface font-semibold">120m outside cadastral boundary</strong> of designated Farm Service contract zone.</p>
                    <div className="flex flex-wrap items-center gap-space-md mt-space-xs font-label-sm text-label-sm text-on-surface-variant">
                      <div className="flex items-center gap-1">
                        <Icon name="person" className="text-[16px] text-primary" />
                        <span>Syndicate Driver: Babatunde Lawal</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="warning" className="text-[16px] text-error" />
                        <span>Geofence Deviation: 120m East</span>
                      </div>
                      <div className="flex items-center gap-1 text-secondary font-semibold">
                        <Icon name="sensors" className="text-[16px]" />
                        <span>CAN-Bus RPM: 2,150 (Idle recommended)</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap lg:flex-col gap-space-xs shrink-0 items-stretch lg:min-w-[210px]">
                  <button className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 bg-primary text-on-primary hover:bg-primary-container px-space-md py-2 rounded-lg font-label-md text-label-md font-semibold shadow-sm transition-colors" type="button">
                    <Icon name="ring_volume" className="text-[18px]" />
                    <span>Ping via USSD / Tel</span>
                  </button>
                  <button className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 bg-surface-container-low text-on-surface hover:bg-surface-container-high px-space-md py-2 rounded-lg font-label-md text-label-md font-semibold transition-colors" type="button">
                    <Icon name="my_location" className="text-[18px]" />
                    <span>Live CAN-Bus &amp; GPS</span>
                  </button>
                  <button className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 text-on-surface-variant hover:text-primary px-space-md py-1.5 rounded-lg font-label-sm text-label-sm transition-colors" type="button">
                    <Icon name="build" className="text-[16px]" />
                    <span>Dispatch Workshop Lead</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-lg p-space-md lg:p-space-lg shadow-sm relative overflow-hidden transition-all hover:shadow-md">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-secondary" />
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-space-md">
                <div className="flex items-start gap-space-md flex-1">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-low text-secondary flex items-center justify-center shrink-0">
                    <Icon name="policy" className="text-[26px]" />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-space-xs">
                      <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold uppercase tracking-wider">Compliance SLA</span>
                      <span className="px-2 py-0.5 rounded bg-surface-container-low text-primary font-label-sm text-label-sm font-semibold">Security &amp; Legal (§11.7)</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">· 09:30 WAT</span>
                      <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded font-label-sm text-label-sm font-bold">28 Days Remaining</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">DSAR Data Export Request Pending Review: Folake Ibironke (#DSAR-2026-006)</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">Farmer Folake Ibironke lodged formal Nigerian Data Protection Act (NDPA 2023) portability request for verified soil test results, farm ledger accounting records, and satellite NDVI historical records. Automated PII sanitization pre-pass completed.</p>
                    <div className="flex flex-wrap items-center gap-space-md mt-space-xs font-label-sm text-label-sm text-on-surface-variant">
                      <div className="flex items-center gap-1">
                        <Icon name="security" className="text-[16px] text-primary" />
                        <span>Masking Protocol: SHA-256 BVN/NIN redact pass</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="verified" className="text-[16px] text-secondary" />
                        <span>Identity Verification: Level 2 Confirmed</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap lg:flex-col gap-space-xs shrink-0 items-stretch lg:min-w-[210px]">
                  <button className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 bg-primary text-on-primary hover:bg-primary-container px-space-md py-2 rounded-lg font-label-md text-label-md font-semibold shadow-sm transition-colors" type="button">
                    <Icon name="folder_zip" className="text-[18px]" />
                    <span>Generate Encrypted ZIP</span>
                  </button>
                  <button className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 bg-surface-container-low text-on-surface hover:bg-surface-container-high px-space-md py-2 rounded-lg font-label-md text-label-md font-semibold transition-colors" type="button">
                    <Icon name="visibility" className="text-[18px]" />
                    <span>Review PII Masking</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-lg p-space-md lg:p-space-lg shadow-sm relative overflow-hidden transition-all hover:shadow-md">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-secondary-fixed-dim" />
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-space-md">
                <div className="flex items-start gap-space-md flex-1">
                  <div className="w-12 h-12 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                    <Icon name="psychology" className="text-[26px]" />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-space-xs">
                      <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold uppercase tracking-wider">AI Advisory</span>
                      <span className="px-2 py-0.5 rounded bg-surface-container-low text-primary font-label-sm text-label-sm font-semibold">CultivaNode Intelligence</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">· 08:15 WAT</span>
                      <span className="bg-surface-container px-2 py-0.5 rounded text-primary font-label-sm text-label-sm font-bold">Confidence 88.4%</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">Fall Armyworm Early Windowing Symptom Detected: Plot B1 Border Zone</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">Mobile Edge Computer Vision confirmed early instar <em>Spodoptera frugiperda</em> foliar pinhole damage from photo uploaded by Field Agent Quadri Olapade during morning transect walk. Immediate biological or targeted chemical spray recommended within 48h.</p>
                    <div className="flex flex-wrap items-center gap-space-md mt-space-xs font-label-sm text-label-sm text-on-surface-variant">
                      <div className="flex items-center gap-1">
                        <Icon name="eco" className="text-[16px] text-primary" />
                        <span>Crop: Maize / Sweet Potato Buffer (Plot B1)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="science" className="text-[16px] text-secondary" />
                        <span>Recommended Rx: Emamectin Benzoate 5% SG</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap lg:flex-col gap-space-xs shrink-0 items-stretch lg:min-w-[210px]">
                  <button className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 bg-primary text-on-primary hover:bg-primary-container px-space-md py-2 rounded-lg font-label-md text-label-md font-semibold shadow-sm transition-colors" type="button">
                    <Icon name="biotech" className="text-[18px]" />
                    <span>Approve Spray Protocol</span>
                  </button>
                  <button className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 bg-surface-container-low text-on-surface hover:bg-surface-container-high px-space-md py-2 rounded-lg font-label-md text-label-md font-semibold transition-colors" type="button">
                    <Icon name="image_search" className="text-[18px]" />
                    <span>Review AI Diagnosis</span>
                  </button>
                  <button className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 text-on-surface-variant hover:text-error px-space-md py-1.5 rounded-lg font-label-sm text-label-sm transition-colors" type="button">
                    <Icon name="close" className="text-[16px]" />
                    <span>Dismiss Advisory</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-space-xl">
          <div className="lg:col-span-8 bg-surface-container-lowest p-space-md lg:p-space-lg rounded-lg shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-sm mb-space-md gap-space-xs">
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface tracking-tight">Notification Channel Matrix &amp; Dispatch Rules (§12.1)</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Statutory failover tiers and multi-channel delivery profiles across rural Nigeria.</p>
                </div>
                <span className="px-space-sm py-1 rounded bg-surface-container-low text-primary font-label-sm text-label-sm font-semibold">Cluster Policy: Savanna Fallback</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                      <th className="py-2.5 px-space-sm rounded-l">Notification Category</th>
                      <th className="py-2.5 px-space-sm">In-App Push</th>
                      <th className="py-2.5 px-space-sm">Termii SMS</th>
                      <th className="py-2.5 px-space-sm">Expo Mobile Push</th>
                      <th className="py-2.5 px-space-sm rounded-r">Language Fallbacks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container text-body-sm font-body-sm">
                    <tr className="hover:bg-surface-container-lowest transition-colors">
                      <td className="py-3 px-space-sm font-semibold text-on-surface">
                        <div className="flex items-center gap-1.5">
                          <Icon name="agriculture" className="text-[18px] text-primary" />
                          <span>Farm Operations &amp; Phenology</span>
                        </div>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded font-label-sm text-label-sm font-semibold">Instant (SQLite Sync)</span>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="text-on-surface-variant font-label-sm text-label-sm">Daily Digest (06:00 WAT)</span>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="text-secondary font-label-sm text-label-sm font-bold">Immediate P1</span>
                      </td>
                      <td className="py-3 px-space-sm text-on-surface font-label-sm text-label-sm">
                        <span className="px-1.5 py-0.5 bg-surface-container rounded mr-1">EN</span>
                        <span className="px-1.5 py-0.5 bg-surface-container rounded mr-1">YOR</span>
                        <span className="px-1.5 py-0.5 bg-surface-container rounded">PID</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container-lowest transition-colors">
                      <td className="py-3 px-space-sm font-semibold text-on-surface">
                        <div className="flex items-center gap-1.5">
                          <Icon name="lock_clock" className="text-[18px] text-tertiary-container" />
                          <span>Escrow &amp; Dispute Timers</span>
                        </div>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded font-label-sm text-label-sm font-semibold">Instant Modal</span>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="text-error font-label-sm text-label-sm font-semibold">Instant (Tier-1 OTP/Alert)</span>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="text-secondary font-label-sm text-label-sm font-bold">Immediate P1</span>
                      </td>
                      <td className="py-3 px-space-sm text-on-surface font-label-sm text-label-sm">
                        <span className="px-1.5 py-0.5 bg-surface-container rounded mr-1">EN</span>
                        <span className="px-1.5 py-0.5 bg-surface-container rounded">YOR</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container-lowest transition-colors">
                      <td className="py-3 px-space-sm font-semibold text-on-surface">
                        <div className="flex items-center gap-1.5">
                          <Icon name="thunderstorm" className="text-[18px] text-error" />
                          <span>Severe Weather Alarms</span>
                        </div>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="bg-error text-on-error px-2 py-0.5 rounded font-label-sm text-label-sm font-bold">Persistent Banner</span>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="text-error font-label-sm text-label-sm font-bold">Flash SMS (High Priority)</span>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="text-error font-label-sm text-label-sm font-bold">Sound Override Buzzer</span>
                      </td>
                      <td className="py-3 px-space-sm text-on-surface font-label-sm text-label-sm">
                        <span className="px-1.5 py-0.5 bg-surface-container rounded mr-1">EN</span>
                        <span className="px-1.5 py-0.5 bg-surface-container rounded mr-1">YOR</span>
                        <span className="px-1.5 py-0.5 bg-surface-container rounded">HAU</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container-lowest transition-colors">
                      <td className="py-3 px-space-sm font-semibold text-on-surface">
                        <div className="flex items-center gap-1.5">
                          <Icon name="psychology" className="text-[18px] text-secondary" />
                          <span>CultivaNode AI Recommendations</span>
                        </div>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="bg-surface-container text-on-surface px-2 py-0.5 rounded font-label-sm text-label-sm">Advisory Card</span>
                      </td>
                      <td className="py-3 px-space-sm text-on-surface-variant font-label-sm text-label-sm">Disabled (Cost Opt.)</td>
                      <td className="py-3 px-space-sm text-on-surface-variant font-label-sm text-label-sm">Standard Push</td>
                      <td className="py-3 px-space-sm text-on-surface font-label-sm text-label-sm">
                        <span className="px-1.5 py-0.5 bg-surface-container rounded mr-1">EN</span>
                        <span className="px-1.5 py-0.5 bg-surface-container rounded">YOR</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="pt-space-md mt-space-md bg-surface-container-low p-space-sm rounded-lg flex flex-col sm:flex-row items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-xs text-body-sm font-body-sm text-on-surface-variant">
                <Icon name="verified" className="text-primary text-[18px]" />
                <span>Automatic network failover triggers Termii SMS after 120s unread push in rural low-bandwidth cells.</span>
              </div>
              <button className="text-primary hover:text-primary-container font-label-sm text-label-sm font-bold shrink-0" type="button">Configure Cluster Dispatch Rules →</button>
            </div>
          </div>
          <div className="lg:col-span-4 bg-surface-container-lowest p-space-md lg:p-space-lg rounded-lg shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-space-sm mb-space-md">
                <h3 className="font-headline-md text-headline-md text-on-surface tracking-tight">Dispatch Preferences</h3>
                <Icon name="tune" className="text-on-surface-variant" />
              </div>
              <div className="flex flex-col gap-space-md">
                <div className="flex items-start justify-between gap-space-sm">
                  <div>
                    <span className="font-label-md text-label-md text-on-surface font-semibold block">Quiet Hours (Night Silence)</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Suppress routine notifications between 21:00 and 05:00 WAT.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input defaultChecked className="sr-only peer" type="checkbox" />
                    <div className="w-11 h-6 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>
                <div className="flex items-start justify-between gap-space-sm">
                  <div>
                    <span className="font-label-md text-label-md text-on-surface font-semibold block">Severe Weather Override</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Bypass quiet hours for flash floods, storms, &amp; armyworm panics.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input defaultChecked className="sr-only peer" type="checkbox" />
                    <div className="w-11 h-6 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>
                <div>
                  <label className="font-label-md text-label-md text-on-surface font-semibold block mb-1">Default Dialect Fallback</label>
                  <div className="grid grid-cols-3 gap-space-xs">
                    <button className="py-1.5 px-space-xs rounded bg-surface-container-low text-primary font-bold font-label-sm text-label-sm text-center" type="button">English (UK)</button>
                    <button className="py-1.5 px-space-xs rounded bg-surface-container text-on-surface font-label-sm text-label-sm text-center hover:bg-surface-container-high transition-colors" type="button">Yorùbá</button>
                    <button className="py-1.5 px-space-xs rounded bg-surface-container text-on-surface font-label-sm text-label-sm text-center hover:bg-surface-container-high transition-colors" type="button">Naija Pidgin</button>
                  </div>
                </div>
                <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-1">
                  <div className="flex items-center justify-between text-label-sm font-label-sm">
                    <span className="text-on-surface-variant">Termii Pool Wallet</span>
                    <span className="font-bold text-primary">₦18,420.00</span>
                  </div>
                  <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mt-1">
                    <div className="bg-secondary h-full" style={{ width: "74%" }} />
                  </div>
                  <span className="text-[11px] text-on-surface-variant mt-0.5">Est. 4,605 local SMS credits remaining</span>
                </div>
              </div>
            </div>
            <button className="w-full mt-space-md py-2 px-space-md bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg font-label-md text-label-md font-semibold transition-colors" type="button">Save Notification Preferences</button>
          </div>
        </div>
        {slot(slots, "statusBar", (
          <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm mb-space-lg flex flex-col lg:flex-row items-center justify-between gap-space-md">
            <div className="flex flex-wrap items-center gap-space-md">
              <div className="flex items-center gap-space-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface font-bold leading-tight">Termii SMS Gateway (Lagos Route)</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant leading-tight">99.2% Delivered · 1.8s Latency</span>
                </div>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface font-bold leading-tight">Expo Mobile Push Service (FCM/APNs)</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant leading-tight">0 Failed Payloads · SSL Encrypted</span>
                </div>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface font-bold leading-tight">Supabase Realtime WebSockets</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant leading-tight">38ms ping · SQLite PowerSync offline cached</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-space-sm font-label-sm text-label-sm text-on-surface-variant shrink-0">
              <Icon name="fingerprint" className="text-[16px] text-primary" />
              <span>Ledger Hash: <code className="bg-surface-container px-1 py-0.5 rounded text-on-surface font-mono">0x9d4e...82bc</code></span>
              <span className="text-secondary font-bold">Audited NDPA §11.7</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
