// Ported from the "messaging_communication_hub" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";

export function MessagingHub(_props: ScreenProps) {
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
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm hover:bg-surface-container-low transition-colors" type="button">
                <Icon name="lock_reset" className="text-[18px]" />
                <span>Audit Privacy</span>
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm hover:bg-surface-container-low transition-colors" type="button">
                <Icon name="download" className="text-[18px]" />
                <span>Export Logs</span>
              </button>
              <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary-container transition-colors" type="button">
                <Icon name="campaign" className="text-[18px]" />
                <span>New Dispatch</span>
              </button>
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
            <div className="p-space-md flex flex-col gap-space-sm bg-surface-container-lowest">
              <div className="relative w-full">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]" />
                <input className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-sm text-body-sm focus:outline-none focus:bg-surface-container transition-colors" placeholder="Search farmer, booking #, parcel..." type="text" />
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-on-surface-variant">
                <button className="px-2.5 py-1 rounded bg-primary text-on-primary font-label-sm text-label-sm whitespace-nowrap" type="button">All (28)</button>
                <button className="px-2.5 py-1 rounded hover:bg-surface-container text-on-surface-variant font-label-sm text-label-sm whitespace-nowrap" type="button">Bookings (12)</button>
                <button className="px-2.5 py-1 rounded hover:bg-surface-container text-on-surface-variant font-label-sm text-label-sm whitespace-nowrap" type="button">Produce (9)</button>
                <button className="px-2.5 py-1 rounded hover:bg-surface-container text-on-surface-variant font-label-sm text-label-sm whitespace-nowrap" type="button">Advisory (4)</button>
                <button className="px-2.5 py-1 rounded hover:bg-surface-container text-on-surface-variant font-label-sm text-label-sm whitespace-nowrap" type="button">Support (3)</button>
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded text-[11px] font-label-sm bg-surface-container-high text-on-surface flex items-center gap-1 cursor-pointer hover:bg-surface-container"><span className="w-1.5 h-1.5 rounded-full bg-error" /> Unread (7)</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-label-sm bg-surface-container-high text-on-surface flex items-center gap-1 cursor-pointer hover:bg-surface-container">High SLA</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-label-sm bg-surface-container-high text-on-surface flex items-center gap-1 cursor-pointer hover:bg-surface-container">SMS Active</span>
              </div>
            </div>
            <div className="flex flex-col max-h-[720px] overflow-y-auto">
              <div className="p-space-sm bg-surface-container-low flex flex-col gap-1.5 cursor-pointer transition-colors relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                <div className="flex items-start justify-between gap-space-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs shrink-0">ML</div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-md text-label-md text-on-surface font-bold truncate">Muritala Lawal &amp; L. Gbadamosi</span>
                      <span className="font-label-sm text-label-sm text-primary font-medium truncate">#BKG-2026-0492 · Rotary Weeding</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">14:18 WAT</span>
                    <span className="w-2 h-2 rounded-full bg-error mt-1" />
                  </div>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 pl-10">GPS polygon shows 18.5 Ha completed. I have uploaded the boulder boundary photos for arbitration...</p>
                <div className="flex flex-wrap items-center gap-1.5 pl-10 pt-1">
                  <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-label-sm text-[10px]">Escrow ₦95k</span>
                  <span className="px-2 py-0.5 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-[10px]">48h SLA</span>
                  <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-[10px]">Proration Stall</span>
                </div>
              </div>
              <div className="p-space-sm hover:bg-surface-container-low flex flex-col gap-1.5 cursor-pointer transition-colors">
                <div className="flex items-start justify-between gap-space-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-on-secondary font-bold text-xs shrink-0">PI</div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-md text-label-md text-on-surface font-semibold truncate">Psaltry PLC &amp; Saki Outgrowers</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant truncate">Off-take #CTR-2026-081 · Cassava</span>
                    </div>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0">13:45 WAT</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 pl-10">Weighbridge gross ticket #9921 stamped. Dry matter starch test results attached (24.8%)...</p>
                <div className="flex items-center gap-1.5 pl-10 pt-1">
                  <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-label-sm text-[10px]">Variance: -1.2 MT</span>
                  <span className="px-2 py-0.5 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-[10px]">Ticket QC</span>
                </div>
              </div>
              <div className="p-space-sm hover:bg-surface-container-low flex flex-col gap-1.5 cursor-pointer transition-colors">
                <div className="flex items-start justify-between gap-space-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-xs shrink-0">QO</div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-md text-label-md text-on-surface font-semibold truncate">Dr. Quadri &amp; Folake Ibironke</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant truncate">Advisory · Plot M2 Maize Top-Dress</span>
                    </div>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0">11:20 WAT</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 pl-10">Flash squall alert: do not apply the 2nd Urea split until soil moisture stabilizes below 80%...</p>
                <div className="flex items-center gap-1.5 pl-10 pt-1">
                  <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-[10px]">Yorùbá Audio</span>
                  <span className="px-2 py-0.5 rounded bg-secondary-container/30 text-on-secondary-container font-label-sm text-[10px]">Weather Flag</span>
                </div>
              </div>
              <div className="p-space-sm hover:bg-surface-container-low flex flex-col gap-1.5 cursor-pointer transition-colors">
                <div className="flex items-start justify-between gap-space-xs">
                  <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-on-surface font-bold text-xs shrink-0">OA</div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-label-md text-label-md text-on-surface font-semibold truncate">Oluwaseun Agrochemicals</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">09:15 WAT</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant truncate">Input PO #ORD-8812 · Emamectin</span>
                  </div>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 pl-10">Consignment dispatched via low-loader transport from Ibadan depot to Iseyin hub...</p>
                <div className="flex items-center gap-1.5 pl-10 pt-1">
                  <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-label-sm text-[10px]">In-Transit</span>
                  <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-label-sm text-[10px]">Waybill #884</span>
                </div>
              </div>
              <div className="p-space-sm hover:bg-surface-container-low flex flex-col gap-1.5 cursor-pointer transition-colors">
                <div className="flex items-start justify-between gap-space-xs">
                  <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-on-surface font-bold text-xs shrink-0">AK</div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-label-md text-label-md text-on-surface font-semibold truncate">Alhaji Kazeem Syndicate</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Yesterday</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant truncate">Assisted Onboarding · Fleet KYC</span>
                  </div>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 pl-10">Leadway insurance certificate and MF 375 chassis photos uploaded for Tier 3 review...</p>
                <div className="flex items-center gap-1.5 pl-10 pt-1">
                  <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-[10px]">Tier 3 Review</span>
                  <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-[10px]">Field Agent Reg</span>
                </div>
              </div>
            </div>
          </div>
          <div className="xl:col-span-6 flex flex-col bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden">
            <div className="p-space-md bg-surface-container-lowest flex flex-col gap-space-xs">
              <div className="flex flex-wrap items-center justify-between gap-space-sm">
                <div className="flex items-center gap-space-sm min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-sm">ML</div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-secondary ring-2 ring-surface-container-lowest" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold truncate">Muritala Lawal</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary-container text-on-secondary-container font-semibold">Tier 2 Operator</span>
                      <span className="text-on-surface-variant text-body-sm">&amp;</span>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold truncate">Gbadamosi Lateef</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-surface-container-high text-on-surface font-semibold">Farmer</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Saki Machinery Syndicate #04 · Field RTK Rover Active</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface transition-colors" title="Call via GSM / Virtual PBX" type="button">
                    <Icon name="call" className="text-[18px]" />
                  </button>
                  <button className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface transition-colors" title="View Cadastral Map" type="button">
                    <Icon name="map" className="text-[18px]" />
                  </button>
                  <button className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-error transition-colors" title="Escalate to Support" type="button">
                    <Icon name="gavel" className="text-[18px]" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-space-xs p-2 rounded-lg bg-surface-container-low text-on-surface font-label-sm text-label-sm mt-1">
                <div className="flex items-center gap-1.5 truncate">
                  <Icon name="link" className="text-[16px] text-primary" />
                  <span className="font-semibold text-primary">Booking #BKG-2026-0492:</span>
                  <span className="truncate">MF 375 Rotary Weeding · Plot M3 (4.50 Ha), Iseyin Savanna</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface font-bold text-[11px] shadow-sm">₦95,000 Zenith Escrow</span>
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
                <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-[11px]">Today · Early Rains Session · 04 May 2026</span>
              </div>
              <div className="flex items-start gap-space-sm max-w-[85%]">
                <div className="w-7 h-7 rounded-full bg-surface-variant text-on-surface flex items-center justify-center font-bold text-xs shrink-0">GL</div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-label-sm text-label-sm font-semibold text-on-surface">Gbadamosi Lateef (Farmer)</span>
                    <span className="text-[11px] text-on-surface-variant">13:50 WAT</span>
                  </div>
                  <div className="p-space-sm rounded-lg rounded-tl-none bg-surface-container-low text-on-surface font-body-sm text-body-sm shadow-sm">Good day Operator Muritala. The tractor stopped near the northern edge of Plot M3 before clearing the 0.68 Ha rocky ridge. Will you finish today? We have rain predicted for tomorrow.</div>
                  <span className="text-[10px] text-on-surface-variant font-label-sm">Delivered via In-App (Read 13:52)</span>
                </div>
              </div>
              <div className="flex items-start gap-space-sm max-w-[85%] self-end flex-row-reverse">
                <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shrink-0">ML</div>
                <div className="flex flex-col gap-1 items-end">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-on-surface-variant">14:02 WAT</span>
                    <span className="font-label-sm text-label-sm font-semibold text-on-surface">Muritala Lawal (Operator)</span>
                  </div>
                  <div className="p-space-sm rounded-lg rounded-tr-none bg-primary text-on-primary font-body-sm text-body-sm shadow-sm flex flex-col gap-space-xs text-left">
                    <p>E ku osan Baba. The northern sector has unmapped granite outcrops. The disc harrow struck rock twice and risked snapping the hydraulic arm. Under CultivaNode ToS §5.4 (Impassable Terrain), we must abort that zone for equipment safety.</p>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="rounded-lg overflow-hidden bg-primary-container p-1 flex flex-col gap-1">
                        <img className="w-full h-24 object-cover rounded" data-alt="Close up photograph of tractor implement struck against rugged granite outcrop boulders in agricultural field under bright tropical daylight with visible earth scratches and equipment safety markers" src="/images/screens/98a0eb878164.webp" alt="" loading="lazy" decoding="async" />
                        <div className="flex flex-col text-[10px] text-on-primary-container px-1">
                          <span className="font-semibold truncate">Granite_Ridge_041.jpg</span>
                          <span>7.9732° N, 3.5901° E · 3.2 MB</span>
                        </div>
                      </div>
                      <div className="rounded-lg overflow-hidden bg-primary-container p-1 flex flex-col gap-1">
                        <img className="w-full h-24 object-cover rounded" data-alt="Close-up field photo of agricultural disc harrow equipment showing safe shear pin condition next to grey bedrock stone on Nigerian farmland plot in dry grass" src="/images/screens/e1cab0077ee0.webp" alt="" loading="lazy" decoding="async" />
                        <div className="flex flex-col text-[10px] text-on-primary-container px-1">
                          <span className="font-semibold truncate">Disc_Scrape_042.jpg</span>
                          <span>7.9735° N, 3.5905° E · 2.8 MB</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-1 text-[11px] text-on-primary-container flex items-center gap-1.5 cursor-pointer hover:underline">
                      <Icon name="translate" className="text-[14px]" />
                      <span>Yorùbá: &quot;Àwọn àpáta wà ní apá àríwá tí ó lè ba ohun èlò jẹ́...&quot;</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-label-sm">Delivered via In-App (Read 14:05)</span>
                </div>
              </div>
              <div className="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-sm text-body-sm shadow-sm">
                <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                  <Icon name="satellite_alt" className="text-[18px]" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-label-sm text-label-sm font-bold text-primary">PostGIS Telemetry Engine · Automatic Calculation</span>
                  <p className="font-body-sm text-body-sm text-on-surface">RTK track log verifies <strong>3.82 Ha traversed</strong> (84.89% of 4.50 Ha target). Suggested prorated settlement: <strong>₦80,645.50 to Operator</strong> / <strong>₦14,354.50 refund to Farmer</strong>.</p>
                </div>
                <button className="px-2.5 py-1 rounded bg-surface-container-lowest text-primary font-label-sm text-label-sm font-semibold shadow-sm shrink-0 hover:bg-surface-container" type="button">Review Algorithmic Split</button>
              </div>
              <div className="flex items-start gap-space-sm max-w-[85%]">
                <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs shrink-0">QO</div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-label-sm text-label-sm font-semibold text-primary">Dr. Quadri Olapade (Lead Agronomist &amp; Inspector)</span>
                    <span className="text-[11px] text-on-surface-variant">14:14 WAT</span>
                  </div>
                  <div className="p-space-sm rounded-lg rounded-tl-none bg-surface-container-low text-on-surface font-body-sm text-body-sm shadow-sm flex flex-col gap-space-xs">
                    <p>I am on-site at Plot M3 with the GPS RTK rover. I confirm the granite ridge is impassable. Both parties please agree to the 84.9% proration split so we release funds without dispute escalation.</p>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-lowest shadow-sm">
                      <button className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0" type="button">
                        <Icon name="play_arrow" className="text-[16px]" />
                      </button>
                      <div className="flex-1 flex flex-col gap-0.5">
                        <div className="flex items-center justify-between text-[11px] font-label-sm text-on-surface-variant">
                          <span>Voice Note · Quadri Olapade</span>
                          <span>0:24 / 0:24</span>
                        </div>
                        <div className="flex items-center gap-0.5 h-3">
                          <span className="w-1 h-2 bg-primary rounded-full" />
                          <span className="w-1 h-3 bg-primary rounded-full" />
                          <span className="w-1 h-2 bg-primary rounded-full" />
                          <span className="w-1 h-3 bg-secondary rounded-full" />
                          <span className="w-1 h-1.5 bg-secondary rounded-full" />
                          <span className="w-1 h-3 bg-primary rounded-full" />
                          <span className="w-1 h-2 bg-primary rounded-full" />
                          <span className="w-1 h-3 bg-secondary rounded-full" />
                          <span className="w-1 h-1.5 bg-surface-variant rounded-full" />
                          <span className="w-1 h-2.5 bg-surface-variant rounded-full" />
                          <span className="w-1 h-1.5 bg-surface-variant rounded-full" />
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary-container/40 text-on-secondary-container font-semibold">EN + YOR</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant font-label-sm">
                    <Icon name="done_all" className="text-[12px] text-tertiary-container" />
                    <span>Termii SMS Mirror sent to +234 803 *** 4192 (Rural fallback active)</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-space-sm max-w-[85%]">
                <div className="w-7 h-7 rounded-full bg-surface-variant text-on-surface flex items-center justify-center font-bold text-xs shrink-0">GL</div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-label-sm text-label-sm font-semibold text-on-surface">Gbadamosi Lateef (Farmer)</span>
                    <span className="text-[11px] text-on-surface-variant">14:18 WAT</span>
                  </div>
                  <div className="p-space-sm rounded-lg rounded-tl-none bg-surface-container-low text-on-surface font-body-sm text-body-sm shadow-sm">Agreed. Quadri&apos;s inspection is clear. Release the operator&apos;s share and refund my balance to my Zenith account.</div>
                  <span className="text-[10px] text-on-surface-variant font-label-sm">Delivered via In-App (Read 14:19)</span>
                </div>
              </div>
            </div>
            <div className="p-space-md bg-surface-container-lowest flex flex-col gap-space-xs">
              <div className="flex flex-wrap items-center justify-between gap-space-xs text-on-surface-variant">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-on-surface-variant font-label-sm text-label-sm">
                  <button className="px-2 py-1 rounded bg-surface-container-high hover:bg-surface-container text-on-surface flex items-center gap-1" type="button"><Icon name="quickreply" className="text-[14px]" /> Canned Templates</button>
                  <button className="px-2 py-1 rounded bg-surface-container-high hover:bg-surface-container text-on-surface flex items-center gap-1" type="button"><Icon name="pin_drop" className="text-[14px]" /> Insert GPS Tag</button>
                  <button className="px-2 py-1 rounded bg-surface-container-high hover:bg-surface-container text-on-surface flex items-center gap-1" type="button"><Icon name="photo_camera" className="text-[14px]" /> Attach PoW Photo</button>
                  <button className="px-2 py-1 rounded bg-surface-container-high hover:bg-surface-container text-on-surface flex items-center gap-1" type="button"><Icon name="mic" className="text-[14px]" /> Record Audio Note</button>
                </div>
                <div className="flex items-center bg-surface-container-low rounded p-0.5 text-on-surface-variant font-label-sm text-[11px]">
                  <button className="px-1.5 py-0.5 rounded bg-surface-container-lowest text-primary font-bold shadow-sm" type="button">EN</button>
                  <button className="px-1.5 py-0.5 rounded hover:text-on-surface" type="button">YOR</button>
                  <button className="px-1.5 py-0.5 rounded hover:text-on-surface" type="button">PID</button>
                </div>
              </div>
              <div className="relative w-full">
                <textarea className="w-full p-space-sm rounded-lg bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-sm text-body-sm focus:outline-none focus:bg-surface-container transition-colors resize-none" placeholder="Compose message to parties... (Press Enter to send, Shift+Enter for newline)" rows={3} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-space-sm pt-1">
                <div className="flex items-center gap-space-sm text-on-surface font-label-sm text-label-sm">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input defaultChecked className="w-4 h-4 rounded text-primary accent-primary" type="checkbox" />
                    <span>Send In-App Push</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-on-surface-variant">
                    <input defaultChecked className="w-4 h-4 rounded text-primary accent-primary" type="checkbox" />
                    <span>Termii SMS Failover (if unread in 120s)</span>
                  </label>
                </div>
                <div className="flex items-center gap-space-xs">
                  <button className="px-3 py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors" type="button">Save Draft</button>
                  <button className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary-container transition-colors" type="button">
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
                <span className="px-2 py-0.5 rounded text-[11px] font-label-sm bg-secondary-container/40 text-on-secondary-container font-bold">#BKG-2026-0492</span>
              </div>
              <div className="flex flex-col gap-2 pt-1 font-body-sm text-body-sm text-on-surface">
                <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                  <span>Status</span>
                  <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-semibold">PoW Verification</span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                  <span>Cluster Parcel</span>
                  <span className="text-on-surface font-medium truncate max-w-[160px]">Iseyin Savanna — Plot M3</span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                  <span>Crop Variety</span>
                  <span className="text-on-surface font-medium">SAMMAZ-52 Maize (V4)</span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                  <span>Escrow Balance</span>
                  <span className="font-bold text-primary">₦95,000.00 Segregated</span>
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
                  <span className="font-label-md text-label-md text-on-surface font-bold">Gbadamosi Lateef</span>
                  <span className="font-label-sm text-[11px] text-on-surface-variant">NIN Verified · 12 Bookings Completed</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface font-label-sm text-[11px] font-bold shadow-sm">4.8 ★</span>
              </div>
              <div className="p-2 rounded bg-surface-container-low flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-bold">Muritala Lawal (Syndicate #04)</span>
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
                <button className="w-full py-2 px-3 rounded-lg bg-tertiary-container text-on-tertiary font-label-md text-label-md shadow-sm hover:bg-tertiary transition-colors flex items-center justify-center gap-1.5" type="button">
                  <Icon name="account_balance_wallet" className="text-[16px]" />
                  <span>Execute Prorated Settlement</span>
                </button>
                <button className="w-full py-1.5 px-3 rounded-lg bg-surface-container-low text-on-surface font-label-sm text-label-sm hover:bg-surface-container transition-colors flex items-center justify-center gap-1" type="button">
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
            <p className="font-body-sm text-[12px] text-on-surface-variant"><strong>Compliance Notice (§12.2):</strong> CultivaNode Communication Gateway complies with Nigeria Data Protection Act (NDPA 2023) Sections 24–34 and NCC Interconnect Regulations. Rural cellular failover routes through Termii DLR-verified gateway with cryptographic tamper-evident message hashes in Supabase Vault.</p>
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
