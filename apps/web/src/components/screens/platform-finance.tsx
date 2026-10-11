// Ported from the "platform_finance_operations_dashboard" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";

export function PlatformFinance(_props: ScreenProps) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <div className="px-space-md lg:px-margin-desktop py-space-lg space-y-space-lg max-w-[1720px] mx-auto w-full">
          <div className="flex flex-col gap-space-sm md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Platform Administration</span>
                <span className="text-on-surface-variant/40 text-xs">/</span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Financial Operations &amp; Settlement</span>
                <span className="text-on-surface-variant/40 text-xs">/</span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold bg-primary-fixed px-2 py-0.5 rounded">§11.4 Operations</span>
              </div>
              <div className="flex items-center gap-space-sm mt-1">
                <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight">Platform Finance Operations</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary-container/30 text-on-secondary-container font-label-sm text-label-sm font-semibold"><span className="w-2 h-2 rounded-full bg-secondary animate-pulse" /> Ledger Synchronized</span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-4xl mt-0.5">Reconcile double-entry ledger journals, Paystack/Flutterwave gateway clearing, NIBSS instant settlement batches, and proof-of-work escrow disbursement queues with cryptographic audit integrity.</p>
            </div>
            <div className="flex items-center gap-space-sm flex-wrap shrink-0 mt-3 md:mt-0">
              <button className="flex items-center gap-2 px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-lg text-label-lg font-semibold shadow-sm hover:bg-surface-container-high transition-colors" type="button">
                <Icon name="sync_alt" className="text-lg text-primary" />
                <span>Reconcile Settlement Feed</span>
              </button>
              <button className="flex items-center gap-2 px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-lg text-label-lg font-semibold shadow-sm hover:bg-surface-container-high transition-colors" type="button">
                <Icon name="verified_user" className="text-lg text-secondary" />
                <span>CBN / NIBSS Ledger</span>
              </button>
              <button className="flex items-center gap-2 px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg font-semibold shadow-sm hover:bg-primary-container transition-colors" type="button">
                <Icon name="payments" className="text-lg text-secondary-fixed" />
                <span>Batch Payout Execution</span>
              </button>
            </div>
          </div>
          <div className="p-space-md rounded-xl bg-surface-container flex flex-col md:flex-row md:items-center justify-between gap-space-sm shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center shrink-0 text-primary">
                <Icon name="account_balance" className="text-lg" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="font-label-md text-label-md font-bold text-on-surface tracking-wide uppercase">Active Settlement Cycle:</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">NIBSS Automated Clearing System (NACS) · Batch Window WAT 16:30</span>
                <span className="hidden sm:inline text-on-surface-variant/40">•</span>
                <span className="inline-flex items-center gap-1 font-label-sm text-label-sm font-semibold text-primary px-2 py-0.5 rounded bg-surface-container-lowest"><Icon name="verified" className="text-sm text-secondary" /> Direct Pilot 0% Platform Commission Policy Active</span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end md:self-auto text-on-surface-variant font-label-sm text-label-sm">
              <Icon name="schedule" className="text-sm" />
              <span>Next Inflow Settlement in: <strong className="text-primary font-semibold">27m 14s</strong></span>
            </div>
          </div>
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-space-md">
            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Total Platform GMV</span>
                <Icon name="stacked_bar_chart" className="p-1 rounded bg-surface-container-low text-primary text-base" />
              </div>
              <div className="my-space-xs">
                <div className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">₦142,680,000</div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Across 482 active contracts</p>
              </div>
              <div className="flex items-center gap-1 text-secondary font-label-sm text-label-sm font-semibold pt-1">
                <Icon name="trending_up" className="text-sm" />
                <span>+14.8% vs past 30d</span>
              </div>
            </div>
            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Active Escrow Locked</span>
                <Icon name="lock_clock" className="p-1 rounded bg-surface-container-low text-tertiary-container text-base" />
              </div>
              <div className="my-space-xs">
                <div className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">₦18,450,000</div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Held in trustee escrow nodes</p>
              </div>
              <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm pt-1">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span>100% Segregated &amp; Liquid</span>
              </div>
            </div>
            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Daily Settled Payouts</span>
                <Icon name="outbound" className="p-1 rounded bg-surface-container-low text-secondary text-base" />
              </div>
              <div className="my-space-xs">
                <div className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">₦8,320,000</div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Disbursed to service syndicates</p>
              </div>
              <div className="flex items-center gap-1 text-secondary font-label-sm text-label-sm font-semibold pt-1">
                <Icon name="verified" className="text-sm" />
                <span>100% BVN validated</span>
              </div>
            </div>
            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Reconciled Ratio</span>
                <Icon name="check_circle" className="p-1 rounded bg-surface-container-low text-secondary text-base" />
              </div>
              <div className="my-space-xs">
                <div className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">99.98%</div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">1,280 cleared ledger lines</p>
              </div>
              <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm pt-1">
                <span>₦0 unreconciled variance</span>
              </div>
            </div>
            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Commission Accrual</span>
                <Icon name="savings" className="p-1 rounded bg-surface-container-low text-primary text-base" />
              </div>
              <div className="my-space-xs">
                <div className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">₦0.00</div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Pilot Zero-Take Phase</p>
              </div>
              <span className="inline-flex items-center text-primary font-label-sm text-label-sm font-semibold">100% Retained by Producers</span>
            </div>
            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm font-semibold text-error uppercase tracking-wider">Exception Queue</span>
                <Icon name="error" className="p-1 rounded bg-error-container text-error text-base" />
              </div>
              <div className="my-space-xs">
                <div className="font-headline-lg text-headline-lg text-error tracking-tight font-bold">2 Items</div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">1 BVN mismatch · 1 NIP timeout</p>
              </div>
              <a className="text-error font-label-sm text-label-sm font-semibold hover:underline inline-flex items-center gap-1" href="#exception-panel">
                <span>Resolve in Queue</span>
                <Icon name="arrow_forward" className="text-xs" />
              </a>
            </div>
          </section>
          <section className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg">
            <div className="xl:col-span-7 flex flex-col gap-space-md">
              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-space-md">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                      <h2 className="font-headline-md text-headline-md text-primary font-bold">Banking Rail &amp; Gateway Clearing Mesh</h2>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Segregated escrow depository balances &amp; direct payout settlement nodes</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-surface-container font-label-sm text-label-sm text-on-surface-variant font-semibold">Real-Time Polling</span>
                    <button className="p-1 rounded bg-surface-container hover:bg-surface-container-high text-primary" title="Refresh Telemetry" type="button">
                      <Icon name="autorenew" className="text-lg" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                  <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col justify-between gap-3">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant">Paystack Clearing</span>
                        <span className="font-label-md text-label-md text-primary font-bold">Zenith Bank Trustee</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-secondary-fixed text-on-secondary-fixed">HEALTHY</span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-headline-sm text-headline-sm text-on-surface font-bold">₦18,450,000</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant font-mono">Acct: •••• 3741</div>
                    </div>
                    <div className="space-y-1 pt-1 font-label-sm text-label-sm text-on-surface-variant">
                      <div className="flex justify-between">
                        <span>Webhook Sync:</span>
                        <span className="text-secondary font-semibold">Active (0ms lag)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Settlement Tier:</span>
                        <span className="font-medium text-on-surface">T+0 Instant</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col justify-between gap-3">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant">Flutterwave Inflow</span>
                        <span className="font-label-md text-label-md text-primary font-bold">USSD / Virtual Accts</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-surface-container-high text-on-surface-variant">TRANSIT</span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-headline-sm text-headline-sm text-on-surface font-bold">₦2,140,000</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant font-mono">Batch #FLW-8930</div>
                    </div>
                    <div className="space-y-1 pt-1 font-label-sm text-label-sm text-on-surface-variant">
                      <div className="flex justify-between">
                        <span>Window:</span>
                        <span className="font-medium text-on-surface">Daily 17:00 WAT</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reconciliation:</span>
                        <span className="text-secondary font-semibold">Balanced</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col justify-between gap-3">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant">NIBSS Instant (NIP)</span>
                        <span className="font-label-md text-label-md text-primary font-bold">Direct Provider Rail</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-secondary-fixed text-on-secondary-fixed">LIVE</span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-headline-sm text-headline-sm text-on-surface font-bold">99.82%</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Success rate past 24h</div>
                    </div>
                    <div className="space-y-1 pt-1 font-label-sm text-label-sm text-on-surface-variant">
                      <div className="flex justify-between">
                        <span>Avg Latency:</span>
                        <span className="font-medium text-on-surface">14 seconds</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Failover:</span>
                        <span className="text-secondary font-semibold">Auto-Route</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container flex flex-col md:flex-row items-center justify-between gap-space-md">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary-container text-secondary-container flex items-center justify-center shrink-0">
                      <Icon name="schema" className="text-lg" />
                    </div>
                    <div>
                      <div className="font-headline-sm text-headline-sm text-primary font-bold">Strict Two-Ledger Isolation Enforced</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant">Ledger 1 (Escrow Clearing &amp; Money Movement) is cryptographically isolated from Ledger 2 (Farmer Farm Books &amp; P&amp;L).</div>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-surface-container-lowest font-mono text-label-sm text-label-sm text-primary font-bold shadow-sm">Audit Proof: Verified</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="xl:col-span-5 flex flex-col gap-space-md">
              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="font-headline-md text-headline-md text-primary font-bold">Daily Reconciliation Run-Rate</h2>
                    <span className="font-label-sm text-label-sm font-semibold text-secondary flex items-center gap-1"><Icon name="balance" className="text-sm" /> ₦0 Variance</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Automated end-of-day balance between bank feeds &amp; platform ledger</p>
                </div>
                <div className="my-space-md space-y-space-md">
                  <div className="p-space-md rounded-lg bg-surface-container-low flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                        <Icon name="south_east" className="text-base" />
                      </span>
                      <div>
                        <div className="font-label-md text-label-md font-bold text-on-surface">Escrow Inflows (Deposits)</div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">42 Farm Cooperatives &amp; Aggregators</div>
                      </div>
                    </div>
                    <div className="font-headline-sm text-headline-sm text-secondary font-bold">+₦14,890,000</div>
                  </div>
                  <div className="p-space-md rounded-lg bg-surface-container-low flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-tertiary-container/10 text-tertiary-container flex items-center justify-center">
                        <Icon name="north_west" className="text-base" />
                      </span>
                      <div>
                        <div className="font-label-md text-label-md font-bold text-on-surface">Provider Outflows (PoW Release)</div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">Tractor Hubs &amp; Harvester Operators</div>
                      </div>
                    </div>
                    <div className="font-headline-sm text-headline-sm text-tertiary-container font-bold">-₦8,320,000</div>
                  </div>
                  <div className="p-space-md rounded-lg bg-surface-container flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Icon name="lock" className="text-base" />
                      </span>
                      <div>
                        <div className="font-label-md text-label-md font-bold text-on-surface">Net Escrow Increment Today</div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">Held in Zenith Trustee Escrow</div>
                      </div>
                    </div>
                    <div className="font-headline-sm text-headline-sm text-primary font-bold">+₦6,570,000</div>
                  </div>
                </div>
                <div className="pt-space-sm flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                  <span>Last Auto-Reconciliation: 15:42 WAT</span>
                  <span className="text-secondary font-semibold flex items-center gap-1"><Icon name="done_all" className="text-xs" /> SHA-256 Merkle Cleared</span>
                </div>
              </div>
            </div>
          </section>
          <section className="space-y-space-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">Live Escrow Disbursement &amp; Proof-of-Work Queue</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Disbursements staged for NIBSS release upon spatial polygon verification and field sign-off</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface-variant font-semibold">4 Actionable Entries</span>
              </div>
            </div>
            <div className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-on-surface">
                  <thead>
                    <tr className="bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      <th className="py-3 px-space-md">Booking / Contract ID</th>
                      <th className="py-3 px-space-md">Transacting Parties</th>
                      <th className="py-3 px-space-md">Escrow Sum</th>
                      <th className="py-3 px-space-md">Proof of Work (PoW) Telemetry</th>
                      <th className="py-3 px-space-md">Dispute Release Timer</th>
                      <th className="py-3 px-space-md text-right">Settlement Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-0 font-body-sm text-body-sm">
                    <tr className="hover:bg-surface-container-low/60 transition-colors">
                      <td className="py-3.5 px-space-md">
                        <div className="font-label-md text-label-md font-bold text-primary font-mono">#BKG-2026-0492</div>
                        <div className="text-on-surface-variant text-xs">Rotary Weeding · 18.5 Ha</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="font-label-md text-label-md font-semibold text-on-surface">Adekunle Farmland Coop</div>
                        <div className="text-on-surface-variant text-xs">Provider: Oyo AgroMach Syndicate #04</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="font-headline-sm text-headline-sm text-on-surface font-bold">₦95,000</div>
                        <div className="text-[11px] text-on-surface-variant font-mono">Held: Paystack Trustee</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary-fixed/50 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> GPS Polygon 100% Cleared (18.5 Ha)</span>
                        <div className="text-[11px] text-on-surface-variant mt-1">Telemetry Hour-Meter: 6.4h matched</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="flex items-center gap-1 text-secondary font-label-sm text-label-sm font-semibold">
                          <Icon name="task_alt" className="text-sm" />
                          <span>Farmer Sign-off Received</span>
                        </div>
                        <div className="text-xs text-on-surface-variant">Signed via Mobile USSD</div>
                      </td>
                      <td className="py-3.5 px-space-md text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="px-3 py-1.5 rounded bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary-container transition-colors shadow-sm" type="button">Authorize NIP Payout</button>
                          <button className="p-1.5 rounded bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors" title="Telemetry Log" type="button">
                            <Icon name="map" className="text-base" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr className="bg-surface-container-lowest/50 hover:bg-surface-container-low/60 transition-colors">
                      <td className="py-3.5 px-space-md">
                        <div className="font-label-md text-label-md font-bold text-primary font-mono">#CTR-2026-081</div>
                        <div className="text-on-surface-variant text-xs">Psaltry Cassava Offtake · 60 MT</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="font-label-md text-label-md font-semibold text-on-surface">Psaltry International PLC</div>
                        <div className="text-on-surface-variant text-xs">Seller: Iseyin Outgrower Union</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="font-headline-sm text-headline-sm text-on-surface font-bold">₦5,040,000</div>
                        <div className="text-[11px] text-on-surface-variant font-mono">Held: Escrow Node A</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary-fixed/50 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Weighbridge Digitally Certified (61.2 MT)</span>
                        <div className="text-[11px] text-on-surface-variant mt-1">Starch content: 22.4% Verified</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="flex items-center gap-1 text-on-surface font-label-sm text-label-sm font-semibold">
                          <Icon name="timer" className="text-sm text-tertiary-container" />
                          <span>Auto-release in 14h 20m</span>
                        </div>
                        <div className="text-xs text-on-surface-variant">48-Hour Grace Window Active</div>
                      </td>
                      <td className="py-3.5 px-space-md text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="px-3 py-1.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors shadow-sm" type="button">Inspect Telemetry</button>
                          <button className="px-3 py-1.5 rounded bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary-container transition-colors shadow-sm" type="button">Release Early</button>
                        </div>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/60 transition-colors">
                      <td className="py-3.5 px-space-md">
                        <div className="font-label-md text-label-md font-bold text-primary font-mono">#BKG-2026-0504</div>
                        <div className="text-on-surface-variant text-xs">Harrowing Syndicate · 34.0 Ha</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="font-label-md text-label-md font-semibold text-on-surface">Oorelope Farmers Cooperative</div>
                        <div className="text-on-surface-variant text-xs">Provider: John Deere Syndicate 02</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="font-headline-sm text-headline-sm text-on-surface font-bold">₦400,000</div>
                        <div className="text-[11px] text-on-surface-variant font-mono">Held: Paystack Trustee</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> GPS In Progress (28.2 / 34 Ha)</span>
                        <div className="text-[11px] text-on-surface-variant mt-1">Expected completion: Today 18:00</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="text-on-surface-variant font-label-sm text-label-sm">Pending Job Completion</div>
                        <div className="text-xs text-on-surface-variant">Escrow locked securely</div>
                      </td>
                      <td className="py-3.5 px-space-md text-right">
                        <button className="px-3 py-1.5 rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm font-semibold cursor-not-allowed" type="button">Locked</button>
                      </td>
                    </tr>
                    <tr className="bg-error-container/20 hover:bg-error-container/30 transition-colors">
                      <td className="py-3.5 px-space-md">
                        <div className="font-label-md text-label-md font-bold text-error font-mono">#BKG-2026-0478</div>
                        <div className="text-on-surface-variant text-xs">Combined Harvesting · 12.0 Ha</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="font-label-md text-label-md font-semibold text-on-surface">Saki West Maize Cluster</div>
                        <div className="text-on-surface-variant text-xs">Provider: Northern Tractors Hub</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="font-headline-sm text-headline-sm text-error font-bold">₦180,000</div>
                        <div className="text-[11px] text-on-surface-variant font-mono">Status: Frozen for Review</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold"><Icon name="warning" className="text-xs" /> Polygon Gap: Only 8.1 Ha verified</span>
                        <div className="text-[11px] text-error font-semibold mt-1">Dispute Filed: Partial completion claim</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="flex items-center gap-1 text-error font-label-sm text-label-sm font-bold">
                          <Icon name="pause_circle" className="text-sm" />
                          <span>Dispute Hold Active</span>
                        </div>
                        <div className="text-xs text-on-surface-variant">Agronomist review underway</div>
                      </td>
                      <td className="py-3.5 px-space-md text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="px-3 py-1.5 rounded bg-tertiary-container text-on-tertiary font-label-sm text-label-sm font-semibold hover:bg-tertiary transition-colors shadow-sm" type="button">Inspect Dispute</button>
                          <button className="px-3 py-1.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors shadow-sm" type="button">Prorate Payout</button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
          <section className="space-y-space-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">Double-Entry Platform Money Ledger Journal</h2>
                    <span className="px-2 py-0.5 rounded bg-surface-container font-mono text-[11px] text-primary font-bold">APPEND-ONLY</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Cryptographic immutable journal log · SHA-256 state chain verification</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high" type="button">
                  <Icon name="filter_list" className="text-base" />
                  <span>Filter Accounts</span>
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high" type="button">
                  <Icon name="download" className="text-base" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
            <div className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-on-surface font-mono">
                  <thead>
                    <tr className="bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-sans">
                      <th className="py-3 px-space-md">Timestamp (WAT)</th>
                      <th className="py-3 px-space-md">Entry # &amp; Ref</th>
                      <th className="py-3 px-space-md">Debit Account (Dr)</th>
                      <th className="py-3 px-space-md">Credit Account (Cr)</th>
                      <th className="py-3 px-space-md text-right">Amount (₦)</th>
                      <th className="py-3 px-space-md">Merkle / State Hash</th>
                      <th className="py-3 px-space-md text-center font-sans">Audit Sync</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-0 text-xs">
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 px-space-md text-on-surface-variant">2026-03-29 16:14:02</td>
                      <td className="py-3 px-space-md text-primary font-bold">
                        <div>#JE-2026-8914</div>
                        <span className="font-sans text-[11px] text-on-surface-variant">PoW Release #BKG-0489</span>
                      </td>
                      <td className="py-3 px-space-md">
                        <div className="text-on-surface font-semibold">2010 · Escrow Liability</div>
                        <span className="font-sans text-[11px] text-on-surface-variant">Paystack Trustee Sub-Ledger</span>
                      </td>
                      <td className="py-3 px-space-md">
                        <div className="text-on-surface font-semibold">1020 · NIBSS Outflow Clearing</div>
                        <span className="font-sans text-[11px] text-on-surface-variant">Provider Disbursal Acct</span>
                      </td>
                      <td className="py-3 px-space-md text-right text-sm font-bold text-primary">₦220,000.00</td>
                      <td className="py-3 px-space-md">
                        <div className="text-secondary font-mono text-[11px]">0x9b7a...3c2f</div>
                        <span className="font-sans text-[10px] text-on-surface-variant">Parent: 0x8a1c...10ea</span>
                      </td>
                      <td className="py-3 px-space-md text-center font-sans">
                        <span className="inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm font-bold"><Icon name="check_circle" className="text-sm" /> Matched</span>
                      </td>
                    </tr>
                    <tr className="bg-surface-container-lowest/40 hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 px-space-md text-on-surface-variant">2026-03-29 15:58:33</td>
                      <td className="py-3 px-space-md text-primary font-bold">
                        <div>#JE-2026-8913</div>
                        <span className="font-sans text-[11px] text-on-surface-variant">Inflow Deposit #DEP-1102</span>
                      </td>
                      <td className="py-3 px-space-md">
                        <div className="text-on-surface font-semibold">1010 · Paystack Clearing</div>
                        <span className="font-sans text-[11px] text-on-surface-variant">Zenith Trustee Deposit</span>
                      </td>
                      <td className="py-3 px-space-md">
                        <div className="text-on-surface font-semibold">2010 · Escrow Liability</div>
                        <span className="font-sans text-[11px] text-on-surface-variant">Farmer Offtake Lock</span>
                      </td>
                      <td className="py-3 px-space-md text-right text-sm font-bold text-on-surface">₦1,500,000.00</td>
                      <td className="py-3 px-space-md">
                        <div className="text-secondary font-mono text-[11px]">0x8a1c...10ea</div>
                        <span className="font-sans text-[10px] text-on-surface-variant">Parent: 0x7f4e...8801</span>
                      </td>
                      <td className="py-3 px-space-md text-center font-sans">
                        <span className="inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm font-bold"><Icon name="check_circle" className="text-sm" /> Matched</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 px-space-md text-on-surface-variant">2026-03-29 15:22:19</td>
                      <td className="py-3 px-space-md text-primary font-bold">
                        <div>#JE-2026-8912</div>
                        <span className="font-sans text-[11px] text-on-surface-variant">USSD Farm Batch #FLW-8930</span>
                      </td>
                      <td className="py-3 px-space-md">
                        <div className="text-on-surface font-semibold">1015 · Flutterwave Transit</div>
                        <span className="font-sans text-[11px] text-on-surface-variant">Wema Virtual Account Collection</span>
                      </td>
                      <td className="py-3 px-space-md">
                        <div className="text-on-surface font-semibold">2010 · Escrow Liability</div>
                        <span className="font-sans text-[11px] text-on-surface-variant">Farmer Syndicate Deposit</span>
                      </td>
                      <td className="py-3 px-space-md text-right text-sm font-bold text-on-surface">₦640,000.00</td>
                      <td className="py-3 px-space-md">
                        <div className="text-secondary font-mono text-[11px]">0x7f4e...8801</div>
                        <span className="font-sans text-[10px] text-on-surface-variant">Parent: 0x6e2a...991d</span>
                      </td>
                      <td className="py-3 px-space-md text-center font-sans">
                        <span className="inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm font-bold"><Icon name="check_circle" className="text-sm" /> Matched</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 px-space-md text-on-surface-variant">2026-03-29 15:22:19</td>
                      <td className="py-3 px-space-md text-primary font-bold">
                        <div>#JE-2026-8911</div>
                        <span className="font-sans text-[11px] text-on-surface-variant">Pilot Commission Verification</span>
                      </td>
                      <td className="py-3 px-space-md">
                        <div className="text-on-surface font-semibold">4010 · Platform Revenue</div>
                        <span className="font-sans text-[11px] text-on-surface-variant">Commission Ledger</span>
                      </td>
                      <td className="py-3 px-space-md">
                        <div className="text-on-surface font-semibold">4020 · Pilot Subsidy Offset</div>
                        <span className="font-sans text-[11px] text-on-surface-variant">Zero-Fee Waiver Policy</span>
                      </td>
                      <td className="py-3 px-space-md text-right text-sm font-bold text-on-surface-variant">₦0.00</td>
                      <td className="py-3 px-space-md">
                        <div className="text-secondary font-mono text-[11px]">0x6e2a...991d</div>
                        <span className="font-sans text-[10px] text-on-surface-variant">Policy: RULE_0_COMMISSION</span>
                      </td>
                      <td className="py-3 px-space-md text-center font-sans">
                        <span className="inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm font-bold"><Icon name="verified" className="text-sm" /> Zero-Verified</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
          <section className="space-y-space-sm" id="exception-panel">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-error animate-ping" />
                  <h2 className="font-headline-lg text-headline-lg text-error font-bold tracking-tight">Financial Exception &amp; Risk Resolution Queue</h2>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">2 unresolved exceptions requiring manual operational intervention or automated retry</p>
              </div>
              <span className="px-3 py-1 rounded bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">High Operational Priority</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md">
              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-space-md">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container font-mono text-xs font-bold">#EXC-092 · PAYOUT STALLED</span>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1.5">Beneficiary BVN Name Discrepancy</h3>
                    </div>
                    <span className="text-on-surface-variant text-xs font-mono">Initiated: 2h 10m ago</span>
                  </div>
                  <div className="p-space-md rounded-lg bg-surface-container-low space-y-2 font-body-sm text-body-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant">Intended Recipient:</span>
                      <span className="font-semibold text-on-surface">Tractor Owner Syndicate #19</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant">Payout Sum:</span>
                      <span className="font-bold text-primary font-mono">₦175,000.00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant">Registered CultivaNode Name:</span>
                      <span className="font-mono text-error font-semibold">&quot;Babatunde G. Lawal&quot;</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant">Commercial Bank BVN (GTBank):</span>
                      <span className="font-mono text-on-surface font-semibold">&quot;Babatunde Gbadamosi&quot;</span>
                    </div>
                    <div className="p-2 rounded bg-surface-container text-xs text-on-surface-variant"><strong>CBN AML Risk Flag:</strong> Partial surname divergence exceeds automated matching threshold (&gt;25% Levenshtein difference). Payout withheld pending confirmation.</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 flex-wrap">
                  <button className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container transition-colors shadow-sm" type="button">Request KYC Re-match</button>
                  <button className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-high transition-colors shadow-sm" type="button">Re-route to Verified Tier-2 BVN</button>
                  <button className="px-space-md py-2 rounded-lg bg-error-container text-on-error-container font-label-md text-label-md font-semibold hover:bg-error/20 transition-colors" type="button">Refund to Escrow</button>
                </div>
              </div>
              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-space-md">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-mono text-xs font-bold">#EXC-093 · NETWORK TIMEOUT</span>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1.5">NIBSS NIP Push Latency Timeout</h3>
                    </div>
                    <span className="text-on-surface-variant text-xs font-mono">Attempt 2 of 3</span>
                  </div>
                  <div className="p-space-md rounded-lg bg-surface-container-low space-y-2 font-body-sm text-body-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant">Destination Rail:</span>
                      <span className="font-semibold text-on-surface">Access Bank PLC (044)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant">Batch Reference:</span>
                      <span className="font-mono text-on-surface">#NIP-99238-ACC</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant">Amount:</span>
                      <span className="font-bold text-primary font-mono">₦320,000.00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant">Switch Error Code:</span>
                      <span className="font-mono text-error font-semibold">91 - System Malfunction / Destination Timeout</span>
                    </div>
                    <div className="p-2 rounded bg-surface-container text-xs text-on-surface-variant"><strong>Idempotency Guard:</strong> Webhook received no debit confirmation. Payout locked in pending state to prevent duplicate disbursement.</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 flex-wrap">
                  <button className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container transition-colors shadow-sm flex items-center gap-1.5" type="button"><Icon name="refresh" className="text-base" /> Force Immediate NIP Retry</button>
                  <button className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-high transition-colors shadow-sm" type="button">Query NIBSS Switch Status</button>
                  <button className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-high transition-colors shadow-sm" type="button">Hold for 18:00 Settlement Batch</button>
                </div>
              </div>
            </div>
          </section>
          <div className="p-space-lg rounded-xl bg-surface-container-low flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container-lowest text-primary flex items-center justify-center shrink-0 shadow-sm">
                <Icon name="policy" className="text-xl" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">CBN Regulatory Compliance &amp; NDPA 2023 Verified</span>
                  <span className="px-2 py-0.5 rounded bg-surface-container-highest text-primary font-label-sm text-label-sm font-semibold">Audit Active</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant max-w-5xl">CultivaNode operates in strict compliance with the Central Bank of Nigeria (CBN) Anti-Money Laundering and Combating the Financing of Terrorism (AML/CFT) framework and Nigeria Data Protection Act (NDPA) 2023. All funds are maintained in segregated trustee accounts held at licensed commercial banks. Farmer private accounting records (&quot;Farm Books&quot;) remain cryptographically quarantined from platform financial operations.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <button className="px-space-md py-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors shadow-sm flex items-center gap-1.5" type="button">
                <Icon name="verified" className="text-base text-secondary" />
                <span>Compliance Certificate</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
