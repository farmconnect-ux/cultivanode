// Ported from the "service_machinery_marketplace" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogAction, ScreenDialogClose } from "@/components/ds/screen-dialog";
import { slot, type ScreenProps } from "./types";

export type ServiceMarketplaceSlot = "search" | "kpis" | "tracker" | "listings";

export function ServiceMarketplace({ slots }: ScreenProps<ServiceMarketplaceSlot>) {
  const panelPowDrawer = (
    <div className="w-full max-w-2xl bg-surface-container-lowest h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
        <div>
          <div className="p-space-lg bg-surface-container flex items-center justify-between">
            <div className="flex items-center gap-space-sm">
              <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed font-bold">
                <Icon name="fact_check" className="text-xl" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Proof-of-Work Inspection</h3>
                  <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">Direct Settlement</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Audit Job: BKG-2026-0492 · Operator: Babatunde Gbadamosi</p>
              </div>
            </div>
            <ScreenDialogClose><button className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-highest transition-colors" type="button">
                <Icon name="close" />
              </button></ScreenDialogClose>
          </div>
          <div className="p-space-lg space-y-space-lg">
            <div className="p-space-md bg-surface-container-low rounded-xl">
              <div className="flex items-start gap-space-sm">
                <Icon name="handshake" className="text-secondary text-2xl shrink-0" />
                <div>
                  <h4 className="font-label-lg text-label-lg text-on-surface font-bold">Pilot Zero-Custody Direct Settlement Policy</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">CultivaNode charges 0% fees and holds zero escrow funds. Review the automated boundary logs and proof photos below. If satisfied, confirm settlement and pay the operator directly via your preferred bank transfer or cash.</p>
                </div>
              </div>
            </div>
            <div className="space-y-space-sm">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold tracking-wider">Cryptographic Telemetry Telematics</span>
              <div className="bg-surface-container-low rounded-xl p-space-md space-y-space-sm">
                <div className="flex items-center justify-between font-body-sm text-body-sm">
                  <span className="text-on-surface-variant flex items-center gap-1.5"><Icon name="check_circle" className="text-sm text-secondary" /> GPS Check-In Timestamp:</span>
                  <span className="font-mono font-semibold text-on-surface">Today, 08:14:02 WAT</span>
                </div>
                <div className="flex items-center justify-between font-body-sm text-body-sm">
                  <span className="text-on-surface-variant flex items-center gap-1.5"><Icon name="check_circle" className="text-sm text-secondary" /> Target Geofence Polygon:</span>
                  <span className="font-mono font-semibold text-on-surface">Plot A1 Boundary (9.0 Ha registered)</span>
                </div>
                <div className="flex items-center justify-between font-body-sm text-body-sm">
                  <span className="text-on-surface-variant flex items-center gap-1.5"><Icon name="check_circle" className="text-sm text-secondary" /> Recorded Swath Trajectory:</span>
                  <span className="font-mono font-semibold text-primary font-bold">6.2 Ha Verified Logged</span>
                </div>
                <div className="flex items-center justify-between font-body-sm text-body-sm">
                  <span className="text-on-surface-variant flex items-center gap-1.5"><Icon name="hourglass_bottom" className="text-sm text-secondary" /> Automatic Dispute Window:</span>
                  <span className="font-semibold text-tertiary">48 Hours Remaining for Farmer Review</span>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold tracking-wider">Field Proof Imagery (With EXIF GPS Stamp)</span>
                <span className="font-label-sm text-label-sm text-secondary font-medium">Auto-synced via PowerSync</span>
              </div>
              <div className="grid grid-cols-2 gap-space-sm">
                <div className="space-y-1">
                  <div className="relative h-36 rounded-lg overflow-hidden bg-surface-container">
                    <img className="w-full h-full object-cover" data-alt="High angle before photo of agricultural plot showing dense ground weeds between established cassava planting mounds in South West Nigeria under sunlight." src="/images/screens/bb46e5e22e06.webp" alt="" loading="lazy" decoding="async" />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-on-surface/80 text-surface font-label-sm text-label-sm font-bold">BEFORE WEEDING</span>
                  </div>
                  <div className="font-mono text-xs text-on-surface-variant">08:21 WAT · Coord: 7.962, 3.593</div>
                </div>
                <div className="space-y-1">
                  <div className="relative h-36 rounded-lg overflow-hidden bg-surface-container">
                    <img className="w-full h-full object-cover" data-alt="High angle after photo of the exact same agricultural plot showing clean weed-free cultivated red loam soil between undamaged healthy cassava plants." src="/images/screens/a23460ee0b59.webp" alt="" loading="lazy" decoding="async" />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-secondary text-on-secondary font-label-sm text-label-sm font-bold">AFTER WEEDING</span>
                  </div>
                  <div className="font-mono text-xs text-on-surface-variant">14:10 WAT · Coord: 7.964, 3.595</div>
                </div>
              </div>
            </div>
            <div className="p-space-md bg-surface-container-high rounded-xl space-y-space-xs">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">Direct Settlement Bank Details</span>
              <div className="flex justify-between items-center pt-1 font-body-sm text-body-sm">
                <span className="text-on-surface-variant">Bank Name:</span>
                <span className="font-semibold text-on-surface">First Bank of Nigeria</span>
              </div>
              <div className="flex justify-between items-center font-body-sm text-body-sm">
                <span className="text-on-surface-variant">Account Number:</span>
                <span className="font-mono font-bold text-primary tracking-wider">3098741029</span>
              </div>
              <div className="flex justify-between items-center font-body-sm text-body-sm">
                <span className="text-on-surface-variant">Account Name:</span>
                <span className="font-semibold text-on-surface">Alhaji Kazeem Syndicate Ent.</span>
              </div>
              <div className="flex justify-between items-center pt-2 font-headline-sm text-headline-sm">
                <span className="font-bold text-on-surface">Net Agreed Fee:</span>
                <span className="font-bold text-primary">₦95,000.00</span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-space-lg bg-surface-container flex flex-col sm:flex-row items-center gap-space-sm shrink-0">
          <ScreenDialogClose><button className="w-full sm:flex-1 py-space-sm bg-primary text-on-primary rounded-lg font-label-md text-label-md shadow-sm hover:bg-primary-container transition-colors flex items-center justify-center gap-2" type="button">
              <Icon name="done_all" className="text-base" />
              <span>Approve PoW &amp; Confirm Direct Settlement</span>
            </button></ScreenDialogClose>
          <ScreenDialogClose><button className="w-full sm:w-auto px-space-md py-space-sm bg-surface-container-lowest text-error rounded-lg font-label-md text-label-md hover:bg-error-container transition-colors" type="button">Raise Dispute</button></ScreenDialogClose>
        </div>
      </div>
  );
  return (
    <div className="screen">
      <div className="flex flex-col w-full pb-space-xl">
        <div className="relative overflow-hidden bg-primary text-on-primary rounded-xl p-space-lg shadow-md mb-space-lg">
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-secondary/20 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md mb-space-sm shadow-sm">
                <Icon name="verified" filled className="text-sm" />
                <span>0% COMMISSION PILOT · DIRECT SETTLEMENT · PROOF-OF-WORK VERIFIED</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-primary font-bold tracking-tight">Machinery Syndicates &amp; Agro-Services</h1>
              <p className="font-body-md text-body-md text-on-primary-container mt-1 max-w-2xl">Zero platform custodial fees. CultivaNode provides GPS polygon auditing, automated hectare tracking, and cryptographic telemetry. Farmers settle 100% directly with verified fleet syndicates upon task completion.</p>
            </div>
            <div className="flex flex-wrap items-center gap-space-sm self-start lg:self-center">
              <button className="px-space-md py-space-sm bg-surface-container-lowest text-primary rounded-lg font-label-lg text-label-lg shadow-sm hover:bg-surface-container-low transition-colors flex items-center gap-space-xs" type="button">
                <Icon name="add_circle" className="text-lg" />
                <span>Post Machinery Need</span>
              </button>
              <button className="px-space-md py-space-sm bg-secondary text-on-secondary rounded-lg font-label-lg text-label-lg shadow-sm hover:bg-primary-container transition-colors flex items-center gap-space-xs" type="button">
                <Icon name="agriculture" className="text-lg" />
                <span>Register Equipment</span>
              </button>
            </div>
          </div>
          {slot(slots, "search", (
            <div className="mt-space-lg pt-space-md bg-primary-container/40 rounded-lg p-space-sm grid grid-cols-1 md:grid-cols-12 gap-space-sm items-center">
              <div className="md:col-span-5 relative">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-primary-container text-lg" />
                <input className="w-full h-10 pl-10 pr-space-sm bg-surface-container-lowest text-on-surface rounded-lg font-body-md text-body-md focus:outline-none shadow-sm" placeholder="Search tractors, boom sprayers, drone pilots, diesel mechanics..." type="text" defaultValue="Rotary Weeding & Disc Harrows" />
              </div>
              <div className="md:col-span-3 flex items-center bg-surface-container-lowest text-on-surface rounded-lg px-space-sm h-10 shadow-sm">
                <Icon name="near_me" className="text-secondary mr-2 text-lg" />
                <select className="w-full bg-transparent text-on-surface font-label-md text-label-md focus:outline-none cursor-pointer">
                  <option>Iseyin Hub (25km Cluster Radius)</option>
                  <option>Saki Agricultural Belt (40km)</option>
                  <option>Ogbomoso Savannah Corridor (50km)</option>
                  <option>Oyo West Basin (15km)</option>
                </select>
              </div>
              <div className="md:col-span-2 flex items-center bg-surface-container-lowest text-on-surface rounded-lg px-space-sm h-10 shadow-sm">
                <Icon name="tune" className="text-secondary mr-2 text-lg" />
                <select className="w-full bg-transparent text-on-surface font-label-md text-label-md focus:outline-none cursor-pointer">
                  <option>All Equipment (28)</option>
                  <option>Heavy Tractors (70+ HP)</option>
                  <option>Boom Sprayers &amp; Drones</option>
                  <option>Certified Mechanics</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <button className="w-full h-10 bg-secondary-fixed text-on-secondary-fixed rounded-lg font-label-md text-label-md hover:bg-secondary-fixed-dim transition-colors flex items-center justify-center gap-1" type="button">
                  <Icon name="filter_list" className="text-base" />
                  <span>Apply Filters</span>
                </button>
              </div>
            </div>
          ))}
        </div>
        {slot(slots, "kpis", (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-lg">
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center justify-between">
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Active Deployments</div>
                <div className="font-metric-num text-metric-num text-on-surface mt-1">4 <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">Jobs live</span></div>
                <div className="flex items-center gap-1 mt-1 text-secondary font-label-sm text-label-sm">
                  <span className="w-2 h-2 rounded-full bg-secondary-container animate-ping" />
                  <span>2 with active GPS telemetry</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-primary">
                <Icon name="pending_actions" className="text-2xl" />
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center justify-between">
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Fleet in Network</div>
                <div className="font-metric-num text-metric-num text-on-surface mt-1">28 <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">Units</span></div>
                <div className="flex items-center gap-1 mt-1 text-secondary font-label-sm text-label-sm">
                  <Icon name="verified" className="text-xs" />
                  <span>100% audited telematics</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-primary">
                <Icon name="precision_manufacturing" className="text-2xl" />
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center justify-between">
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Proof-of-Work Completed</div>
                <div className="font-metric-num text-metric-num text-on-surface mt-1">142 <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">Hectares</span></div>
                <div className="flex items-center gap-1 mt-1 text-secondary font-label-sm text-label-sm">
                  <Icon name="handshake" className="text-xs" />
                  <span>₦0 commission levied</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-primary">
                <Icon name="task_alt" className="text-2xl" />
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center justify-between">
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Aggregated Demand</div>
                <div className="font-metric-num text-metric-num text-on-surface mt-1">3 <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">Clusters</span></div>
                <div className="flex items-center gap-1 mt-1 text-tertiary-container font-label-sm text-label-sm">
                  <Icon name="local_shipping" className="text-xs" />
                  <span>45% transit discount pooled</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-primary">
                <Icon name="hub" className="text-2xl" />
              </div>
            </div>
          </div>
        ))}
        <div className="bg-surface-container-low rounded-xl p-space-lg shadow-sm mb-space-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md">
          <div className="flex items-start gap-space-md">
            <div className="p-space-sm bg-tertiary-fixed rounded-lg text-tertiary flex items-center justify-center shrink-0">
              <Icon name="share_location" className="text-3xl" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded font-label-sm text-label-sm bg-tertiary text-on-tertiary font-bold tracking-wider">CLUSTER MOBILIZATION OPPORTUNITY</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Iseyin South Savannah Block</span>
              </div>
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold mt-1">4 Neighboring Farms Pooled · 36.0 Hectares Harrowing</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-2xl mt-1">Farms within 3.2km (Afolabi Organic, Kasali Grain Hub, Alade Ridge &amp; Your Plot A) have aggregated continuous ploughing requests. Syndicate flatbed mobilization surcharge is split 4-ways, slashing transit overhead from ₦35,000 to ₦8,750 per farm.</p>
            </div>
          </div>
          <div className="flex items-center gap-space-sm w-full lg:w-auto shrink-0">
            <div className="text-right hidden xl:block pr-space-sm">
              <div className="font-label-sm text-label-sm text-on-surface-variant">Combined Rate Lock</div>
              <div className="font-headline-sm text-headline-sm text-primary font-bold">₦26,500 <span className="font-body-sm text-body-sm font-normal text-on-surface-variant">/ Ha</span></div>
            </div>
            <button className="w-full lg:w-auto px-space-md py-space-sm bg-primary text-on-primary rounded-lg font-label-md text-label-md shadow-sm hover:bg-primary-container transition-all flex items-center justify-center gap-2" type="button">
              <Icon name="group_work" className="text-base" />
              <span>Join Cluster Dispatch Roster</span>
            </button>
          </div>
        </div>
        {slot(slots, "tracker", (
          <div className="bg-surface-container-lowest rounded-xl shadow-sm mb-space-lg overflow-hidden">
            <div className="p-space-md bg-surface-container flex flex-wrap items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-sm">
                <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-secondary">
                  <span className="w-1.5 h-1.5 rounded-full bg-surface-container-lowest animate-ping" />
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Live Execution &amp; PoW Tracker</span>
                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">In Progress (Plot A1)</span>
              </div>
              <div className="flex items-center gap-space-sm">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Booking ID: <strong className="text-on-surface font-mono">BKG-2026-0492</strong></span>
                <span className="text-on-surface-variant">·</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Settlement Protocol: <strong className="text-secondary font-semibold">Direct Bank/Cash on Delivery</strong></span>
              </div>
            </div>
            <div className="p-space-lg grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
              <div className="lg:col-span-7 flex flex-col justify-between space-y-space-md">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-space-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-headline-md text-headline-md text-on-surface font-bold">John Deere 5075E (75 HP MFWD)</h3>
                        <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-mono text-xs">OYO-982-KW</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Operation: <strong className="text-on-surface">Mechanical Rotary Weeding</strong> · Farm Sector: <strong className="text-on-surface">Plot A1 Cassava Intercrop (9.0 Ha)</strong></p>
                    </div>
                    <div className="text-right">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Direct Settlement Fee</span>
                      <div className="font-metric-num text-metric-num text-primary font-bold">₦95,000</div>
                      <span className="font-label-sm text-label-sm text-secondary font-medium">₦0 Platform Escrow Levy</span>
                    </div>
                  </div>
                  <div className="mt-space-md p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-space-sm">
                      <img className="w-10 h-10 rounded-full object-cover shadow-sm" data-alt="A portrait photograph of a confident Yoruba Nigerian male agricultural machine operator wearing protective ear defenders and a branded green cotton work shirt under warm afternoon sun in Oyo State." src="/images/screens/47ca5be3ef95.webp" alt="" loading="lazy" decoding="async" />
                      <div>
                        <div className="font-label-md text-label-md text-on-surface font-bold">Babatunde Gbadamosi</div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">Alhaji Kazeem Syndicate (Verified Provider) · ★ 4.95 (48 jobs)</div>
                      </div>
                    </div>
                    <a className="px-3 py-1.5 bg-surface-container-lowest text-primary rounded-lg font-label-sm text-label-sm shadow-sm hover:bg-surface-container-high flex items-center gap-1 transition-colors" href="tel:08000000000">
                      <Icon name="phone" className="text-sm" />
                      <span>Call Operator</span>
                    </a>
                  </div>
                  <div className="mt-space-md space-y-space-sm">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Hectare Work Done (GPS Polygons Logged)</span>
                        <span className="font-label-md text-label-md text-primary font-bold">6.2 Ha of 9.0 Ha (68.8%)</span>
                      </div>
                      <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-secondary transition-all duration-500" style={{ width: "68.8%" }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-space-sm pt-2">
                      <div className="p-space-sm bg-surface-container-low rounded-lg">
                        <div className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                          <Icon name="speed" className="text-xs text-secondary" />
                          <span>Engine RPM</span>
                        </div>
                        <div className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">1,420 <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">RPM</span></div>
                        <span className="font-label-sm text-label-sm text-secondary">Nominal PTO Load</span>
                      </div>
                      <div className="p-space-sm bg-surface-container-low rounded-lg">
                        <div className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                          <Icon name="explore" className="text-xs text-secondary" />
                          <span>Ground Velocity</span>
                        </div>
                        <div className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">5.4 <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">km/h</span></div>
                        <span className="font-label-sm text-label-sm text-secondary">Optimum Weeding Pace</span>
                      </div>
                      <div className="p-space-sm bg-surface-container-low rounded-lg">
                        <div className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                          <Icon name="fence" className="text-xs text-secondary" />
                          <span>Geofence Status</span>
                        </div>
                        <div className="font-headline-sm text-headline-sm text-secondary font-bold mt-1">Locked In</div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">0 Boundary Breaches</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-space-sm flex flex-wrap items-center gap-space-sm">
                  <ScreenDialog title="Proof-Of-Work Inspection" side="right" panel={panelPowDrawer}>
                    <button className="px-space-md py-space-sm bg-primary text-on-primary rounded-lg font-label-md text-label-md shadow-sm hover:bg-primary-container transition-colors flex items-center gap-2" type="button">
                      <Icon name="verified" className="text-base" />
                      <span>Review Proof Photos &amp; Settle</span>
                    </button>
                  </ScreenDialog>
                  <button className="px-space-md py-space-sm bg-surface-container-low text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container-high transition-colors flex items-center gap-2" type="button">
                    <Icon name="route" className="text-base" />
                    <span>Inspect Real-Time GPS Track</span>
                  </button>
                  <button className="px-space-md py-space-sm bg-surface-container-low text-error rounded-lg font-label-md text-label-md hover:bg-error-container transition-colors flex items-center gap-2 ml-auto" type="button">
                    <Icon name="report" className="text-base" />
                    <span>Flag Issue / Boundary Alert</span>
                  </button>
                </div>
              </div>
              <div className="lg:col-span-5 flex flex-col justify-between">
                <div className="relative w-full h-64 lg:h-full min-h-[260px] rounded-xl overflow-hidden shadow-inner bg-surface-container">
                  <div className="w-full h-full bg-cover bg-center" data-location="Iseyin, Nigeria" style={{ backgroundImage: "url('/images/screens/106681f379f9.webp')" }} />
                  <div className="absolute top-3 left-3 bg-surface-container-lowest/90 backdrop-blur-md p-2 rounded-lg shadow-sm text-xs font-mono space-y-0.5">
                    <div className="flex items-center gap-1 text-primary font-bold">
                      <span className="w-2 h-2 rounded-full bg-secondary" />
                      <span>GPS FIX: RTK ACCURACY (±2.5cm)</span>
                    </div>
                    <div className="text-on-surface-variant">LAT: 7.9621° N · LON: 3.5932° E</div>
                    <div className="text-on-surface-variant">BOUNDS: PLOT A1 (POLY-9812-CULTIVA)</div>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-surface-container-lowest/95 backdrop-blur-md p-2 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface">
                      <Icon name="timelapse" className="text-base text-secondary" />
                      <span>Estimated finish: Today, 16:45 WAT</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {slot(slots, "listings", (
          <div className="space-y-space-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Verified Machinery &amp; Technical Services Near You</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">All equipment vetted with physical frame inspection, calibration reports, and verified operator credentials.</p>
              </div>
              <div className="flex items-center gap-space-sm">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Sort by:</span>
                <button className="px-space-sm py-1 bg-surface-container-lowest rounded-lg font-label-sm text-label-sm text-on-surface shadow-sm" type="button">Closest Proximity</button>
                <button className="px-space-sm py-1 bg-surface-container text-on-surface-variant rounded-lg font-label-sm text-label-sm hover:text-on-surface" type="button">Highest Rating</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
              <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="relative h-44 w-full overflow-hidden bg-surface-container">
                    <img className="w-full h-full object-cover" data-alt="A clean industrial photograph of a rugged red Massey Ferguson 375 agricultural tractor fitted with a heavy duty disc harrow implement standing on agricultural savanna soil in Nigeria under bright natural daylight." src="/images/screens/95420bf3342b.webp" alt="" loading="lazy" decoding="async" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Available Today</span>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-surface-container-lowest/90 font-label-sm text-label-sm text-on-surface font-mono">6km away</span>
                  </div>
                  <div className="p-space-md">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase">Heavy Tillage Syndicate</span>
                      <div className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface">
                        <Icon name="star" filled className="text-sm text-amber-500" />
                        <span className="font-bold">4.9</span>
                        <span className="text-on-surface-variant">(34 PoW)</span>
                      </div>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">MF 375 (75 HP) + Disc Harrow</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-2">Ideal for primary ploughing and heavy virgin brush breakups. Includes certified operator and auxiliary fuel cache.</p>
                    <div className="mt-space-md pt-space-sm bg-surface-container-low rounded-lg p-space-sm space-y-1">
                      <div className="flex justify-between font-label-sm text-label-sm">
                        <span className="text-on-surface-variant">Daily Capacity:</span>
                        <span className="font-semibold text-on-surface">12–15 Hectares</span>
                      </div>
                      <div className="flex justify-between font-label-sm text-label-sm">
                        <span className="text-on-surface-variant">Settlement Mode:</span>
                        <span className="font-semibold text-secondary">Direct Post-Work</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-space-md pt-0">
                  <div className="flex items-baseline justify-between mb-space-sm">
                    <div>
                      <span className="font-metric-num text-metric-num text-primary font-bold">₦28,000</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">/ Hectare</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">+₦0 fee</span>
                  </div>
                  <button className="w-full py-space-sm bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary-container transition-colors flex items-center justify-center gap-1" type="button">
                    <Icon name="calendar_add_on" className="text-base" />
                    <span>Book Equipment</span>
                  </button>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="relative h-44 w-full overflow-hidden bg-surface-container">
                    <img className="w-full h-full object-cover" data-alt="High-clearance specialized agricultural boom sprayer vehicle in green and yellow livery driving through tall crop rows in a Nigerian farm field during golden hour morning light with mist nozzles visible." src="/images/screens/f9fbfd6131d8.webp" alt="" loading="lazy" decoding="async" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Ready in 2h</span>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-surface-container-lowest/90 font-label-sm text-label-sm text-on-surface font-mono">11km away</span>
                  </div>
                  <div className="p-space-md">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase">Crop Protection Fleet</span>
                      <div className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface">
                        <Icon name="star" filled className="text-sm text-amber-500" />
                        <span className="font-bold">4.8</span>
                        <span className="text-on-surface-variant">(22 PoW)</span>
                      </div>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">High-Clearance Boom Sprayer</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-2">18-meter wingspan, calibrated anti-drift nozzles for herbicides and foliage fertilizer. Operator &amp; safety suite included.</p>
                    <div className="mt-space-md pt-space-sm bg-surface-container-low rounded-lg p-space-sm space-y-1">
                      <div className="flex justify-between font-label-sm text-label-sm">
                        <span className="text-on-surface-variant">Daily Capacity:</span>
                        <span className="font-semibold text-on-surface">30–40 Hectares</span>
                      </div>
                      <div className="flex justify-between font-label-sm text-label-sm">
                        <span className="text-on-surface-variant">Calibration Log:</span>
                        <span className="font-semibold text-secondary">Verified 3 Days Ago</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-space-md pt-0">
                  <div className="flex items-baseline justify-between mb-space-sm">
                    <div>
                      <span className="font-metric-num text-metric-num text-primary font-bold">₦15,000</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">/ Hectare</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Excl. chemical</span>
                  </div>
                  <button className="w-full py-space-sm bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary-container transition-colors flex items-center justify-center gap-1" type="button">
                    <Icon name="calendar_add_on" className="text-base" />
                    <span>Book Equipment</span>
                  </button>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="relative h-44 w-full overflow-hidden bg-surface-container">
                    <img className="w-full h-full object-cover" data-alt="A high tech commercial agricultural octocopter drone resting on a tripod ground pad beside a laptop screen showing NDVI vegetative color maps on an open savanna farm in Oyo North." src="/images/screens/3f820cefce69.webp" alt="" loading="lazy" decoding="async" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Dispatched w/ Pilot</span>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-surface-container-lowest/90 font-label-sm text-label-sm text-on-surface font-mono">18km away</span>
                  </div>
                  <div className="p-space-md">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase">Precision Agronomy</span>
                      <div className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface">
                        <Icon name="star" filled className="text-sm text-amber-500" />
                        <span className="font-bold">5.0</span>
                        <span className="text-on-surface-variant">(19 PoW)</span>
                      </div>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">Multispectral NDVI Aerial Mapping</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-2">High resolution crop stress, water deficit, and canopy health analytics with same-day shapefile upload to CultivaNode.</p>
                    <div className="mt-space-md pt-space-sm bg-surface-container-low rounded-lg p-space-sm space-y-1">
                      <div className="flex justify-between font-label-sm text-label-sm">
                        <span className="text-on-surface-variant">Turnaround:</span>
                        <span className="font-semibold text-on-surface">Same-day Orthomosaic</span>
                      </div>
                      <div className="flex justify-between font-label-sm text-label-sm">
                        <span className="text-on-surface-variant">Pilot License:</span>
                        <span className="font-semibold text-secondary">NCAA Registered</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-space-md pt-0">
                  <div className="flex items-baseline justify-between mb-space-sm">
                    <div>
                      <span className="font-metric-num text-metric-num text-primary font-bold">₦8,500</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">/ Hectare</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Min. 5 Ha</span>
                  </div>
                  <button className="w-full py-space-sm bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary-container transition-colors flex items-center justify-center gap-1" type="button">
                    <Icon name="calendar_add_on" className="text-base" />
                    <span>Request Flight</span>
                  </button>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="relative h-44 w-full overflow-hidden bg-surface-container">
                    <img className="w-full h-full object-cover" data-alt="An expert Nigerian male heavy diesel mechanic working on a large tractor engine bay with specialized hydraulic diagnostic tools in a clean agricultural workshop in Iseyin." src="/images/screens/4d6d1087e6da.webp" alt="" loading="lazy" decoding="async" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">On Call</span>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-surface-container-lowest/90 font-label-sm text-label-sm text-on-surface font-mono">Iseyin Center (4km)</span>
                  </div>
                  <div className="p-space-md">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase">Technical Support &amp; Fleet Care</span>
                      <div className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface">
                        <Icon name="star" filled className="text-sm text-amber-500" />
                        <span className="font-bold">4.9</span>
                        <span className="text-on-surface-variant">(67 PoW)</span>
                      </div>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">Field Hydraulic &amp; Engine Specialist</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-2">Master diesel diagnostics, PTO rebuilds, steering rams, and emergency on-field breakdown rescue across Oyo North.</p>
                    <div className="mt-space-md pt-space-sm bg-surface-container-low rounded-lg p-space-sm space-y-1">
                      <div className="flex justify-between font-label-sm text-label-sm">
                        <span className="text-on-surface-variant">Response Time:</span>
                        <span className="font-semibold text-on-surface">&lt; 45 minutes</span>
                      </div>
                      <div className="flex justify-between font-label-sm text-label-sm">
                        <span className="text-on-surface-variant">Toolkit:</span>
                        <span className="font-semibold text-secondary">Mobile Field Van</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-space-md pt-0">
                  <div className="flex items-baseline justify-between mb-space-sm">
                    <div>
                      <span className="font-metric-num text-metric-num text-primary font-bold">₦12,000</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">/ Base Visit</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">+ parts direct</span>
                  </div>
                  <button className="w-full py-space-sm bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary-container transition-colors flex items-center justify-center gap-1" type="button">
                    <Icon name="build" className="text-base" />
                    <span>Dispatch Mechanic</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
