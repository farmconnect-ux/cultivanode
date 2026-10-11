// Ported from the "field_agent_assisted_onboarding_hub" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import { slot, type ScreenProps } from "./types";

export type AgentOnboardingHubSlot = "agentLine" | "actions" | "kpis" | "wizard" | "roster";

export function AgentOnboardingHub({ slots }: ScreenProps<AgentOnboardingHubSlot>) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full pb-16 space-y-8">
        <section className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-surface-container-lowest p-6 rounded-xl shadow-sm">
          <div className="flex flex-col space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase tracking-wider">Extension Office M1 &amp; M7 Operational Hub</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm"><span className="w-2 h-2 rounded-full bg-secondary animate-pulse" /> Jurisdiction: Iseyin &amp; Oke-Ogun South</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface tracking-tight">Field Agent &amp; Assisted Onboarding Hub</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Community field registrations, GPS boundary walk capture, assisted service bookings, and PowerSync offline sync queue.</p>
            {slot(slots, "agentLine", (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="inline-flex items-center gap-2 text-on-surface font-label-md text-label-md">
                  <Icon name="badge" className="text-secondary text-lg" />
                  <span>Quadri Olapade (Senior Extension Agent #AG-OYO-042)</span>
                </div>
                <span className="text-outline-variant">•</span>
                <div className="inline-flex items-center gap-1.5 text-on-surface-variant font-label-md text-label-md bg-surface-container-low px-2.5 py-1 rounded-md">
                  <Icon name="cloud_sync" className="text-secondary text-base" />
                  <span>PowerSync SQLite Node: <strong>14 Records Queued</strong></span>
                </div>
              </div>
            ))}
          </div>
          {slot(slots, "actions", (
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 self-start xl:self-center">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-primary-container text-on-primary rounded-lg font-label-lg text-label-lg shadow-sm hover:bg-primary transition-all" type="button">
                <Icon name="person_add" className="text-lg" />
                <span>+ Register Farmer (NIN Assisted)</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-low text-on-surface rounded-lg font-label-lg text-label-lg hover:bg-surface-container transition-all" type="button">
                <Icon name="timeline" className="text-secondary text-lg" />
                <span>Start GPS Boundary Walk</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-lowest text-secondary rounded-lg font-label-lg text-label-lg shadow-sm hover:bg-surface-container-low transition-all" type="button">
                <Icon name="sync" className="text-lg" />
                <span>Sync Offline Submissions</span>
              </button>
            </div>
          ))}
        </section>
        {slot(slots, "kpis", (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Farmers Onboarded</span>
                <span className="p-2 rounded-lg bg-surface-container text-secondary">
                  <Icon name="group" className="text-xl" />
                </span>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-num text-metric-num text-on-surface">128 Farmers</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-secondary font-label-md text-label-md">
                  <Icon name="trending_up" className="text-base" />
                  <span>+18 this week</span>
                  <span className="text-on-surface-variant font-normal">• 94% verified</span>
                </div>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="bg-secondary h-1.5 rounded-full" style={{ width: "94%" }} />
              </div>
            </div>
            <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Land Area Mapped</span>
                <span className="p-2 rounded-lg bg-surface-container text-secondary">
                  <Icon name="polyline" className="text-xl" />
                </span>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-num text-metric-num text-on-surface">342.5 Ha</span>
                </div>
                <p className="mt-2 text-on-surface-variant font-body-sm text-body-sm">Average 2.67 Ha per smallholder plot</p>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="bg-primary-container h-1.5 rounded-full" style={{ width: "82%" }} />
              </div>
            </div>
            <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Service Bookings</span>
                <span className="p-2 rounded-lg bg-surface-container text-secondary">
                  <Icon name="agriculture" className="text-xl" />
                </span>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-num text-metric-num text-on-surface">₦1,850,000</span>
                </div>
                <p className="mt-2 text-on-surface-variant font-body-sm text-body-sm">42 machinery &amp; labor jobs • 0% commission pilot</p>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="bg-secondary-container h-1.5 rounded-full" style={{ width: "68%" }} />
              </div>
            </div>
            <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Agent Commission</span>
                <span className="p-2 rounded-lg bg-surface-container text-tertiary-container">
                  <Icon name="account_balance_wallet" className="text-xl" />
                </span>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-num text-metric-num text-primary">₦142,500</span>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold">Accrued</span>
                </div>
                <p className="mt-2 text-on-surface-variant font-body-sm text-body-sm">₦1,000/verified farmer + ₦500/Ha mapped</p>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="bg-secondary h-1.5 rounded-full" style={{ width: "76%" }} />
              </div>
            </div>
          </section>
        ))}
        {slot(slots, "wizard", (
          <section className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-sm" id="wizard-section">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-surface-container gap-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <Icon name="tablet_mac" className="text-secondary" />
                  <h2 className="font-headline-lg text-headline-lg text-on-surface">Assisted Farmer Registration &amp; Survey Wizard</h2>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1">Designed for quick offline field execution. Auto-caches locally to SQLite via PowerSync.</p>
              </div>
              <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-lg text-on-surface font-label-md text-label-md">
                <Icon name="signal_cellular_connected_no_internet_4_bar" className="text-secondary text-base" />
                <span>Field Mode: Standalone Form Auto-Cache</span>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-6">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-high text-on-surface">
                <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-md text-label-md font-bold">1</div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-sm text-label-sm text-primary font-bold uppercase">Identity &amp; NIN</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant truncate">OTP, NIN, Portrait</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low text-on-surface">
                <div className="w-8 h-8 rounded-full bg-surface-container text-on-surface flex items-center justify-center font-label-md text-label-md font-bold">2</div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-sm text-label-sm text-on-surface font-semibold uppercase">GPS Boundary Walk</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant truncate">Real-time Polygon (Ha)</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low text-on-surface">
                <div className="w-8 h-8 rounded-full bg-surface-container text-on-surface flex items-center justify-center font-label-md text-label-md font-bold">3</div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-sm text-label-sm text-on-surface font-semibold uppercase">Enterprise Selection</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant truncate">Crops, Seed, Planting</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low text-on-surface">
                <div className="w-8 h-8 rounded-full bg-surface-container text-on-surface flex items-center justify-center font-label-md text-label-md font-bold">4</div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-sm text-label-sm text-on-surface font-semibold uppercase">Tier Verification</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant truncate">Tier 1 / Tier 2 Payout</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-4">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2"><Icon name="person_pin" className="text-secondary text-lg" /> Step 1: Bio-Data &amp; National Identity</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">Full Name (as per NIN)</label>
                      <input className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-container" type="text" defaultValue="Gbadamosi Lateef Adebowale" />
                    </div>
                    <div>
                      <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">Mobile Phone Number</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-lg bg-surface-container font-label-md text-label-md text-on-surface">+234</span>
                        <input className="w-full px-3.5 py-2.5 rounded-r-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-container" type="tel" defaultValue="803 459 2819" />
                      </div>
                    </div>
                    <div>
                      <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">National Identity Number (NIN)</label>
                      <div className="relative">
                        <input className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-container" type="text" defaultValue="7382 9104 2910" />
                        <Icon name="verified" className="absolute right-3 top-2.5 text-secondary text-lg" label="Live NIMC validation active" />
                      </div>
                    </div>
                    <div>
                      <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">Village / Hamlet</label>
                      <input className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-container" type="text" defaultValue="Ado-Awaye settlement, Ward 4" />
                    </div>
                  </div>
                </div>
                <div className="space-y-4 pt-4 border-t border-surface-container">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2"><Icon name="spa" className="text-secondary text-lg" /> Enterprise &amp; Production Focus</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="flex items-center gap-3 p-3.5 rounded-lg bg-surface-container-low cursor-pointer hover:bg-surface-container transition-all">
                      <input defaultChecked className="w-4 h-4 text-primary rounded" type="checkbox" />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface">Cassava (TME 419)</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">Tubers / Stems</span>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3.5 rounded-lg bg-surface-container-low cursor-pointer hover:bg-surface-container transition-all">
                      <input defaultChecked className="w-4 h-4 text-primary rounded" type="checkbox" />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface">Yellow Maize</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">Early Rains &apos;26</span>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3.5 rounded-lg bg-surface-container-low cursor-pointer hover:bg-surface-container transition-all">
                      <input className="w-4 h-4 text-primary rounded" type="checkbox" />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface">Soybean (TGX)</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">Intercropped</span>
                      </div>
                    </label>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4">
                  <button className="px-4 py-2.5 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high" type="button">Save Draft to Tablet</button>
                  <div className="flex items-center gap-3">
                    <button className="px-4 py-2.5 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high" type="button">SMS OTP Challenge</button>
                    <button className="px-6 py-2.5 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary transition-all flex items-center gap-2" type="button">
                      <span>Next: Boundary GPS Walk</span>
                      <Icon name="arrow_forward" className="text-base" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-surface-container-low p-5 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon name="explore" className="text-secondary" />
                      <span className="font-headline-sm text-headline-sm text-on-surface">GPS Boundary Walk Capture</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">HDOP: 0.8m (Accurate)</span>
                  </div>
                  <div className="relative w-full h-56 rounded-lg overflow-hidden bg-inverse-surface shadow-inner flex flex-col justify-between p-3" data-location="Iseyin, Oyo State, Nigeria">
                    <div className="flex items-center justify-between z-10">
                      <span className="bg-inverse-surface/80 text-inverse-on-surface px-2.5 py-1 rounded text-xs font-label-sm text-label-sm flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary-fixed" /> 24 Coordinates Logged</span>
                      <span className="bg-inverse-surface/80 text-inverse-on-surface px-2 py-1 rounded font-label-sm text-label-sm">Lat: 7.9732° N | Long: 3.5961° E</span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
                      <svg className="w-full h-full stroke-secondary fill-secondary-container/20" viewBox="0 0 200 120">
                        <polygon points="20,25 90,15 170,35 155,95 80,105 30,80" strokeDasharray="4 2" strokeWidth="2.5" />
                        <circle cx="20" cy="25" fill="#6cf8bb" r="4" />
                        <circle cx="90" cy="15" fill="#6cf8bb" r="4" />
                        <circle cx="170" cy="35" fill="#6cf8bb" r="4" />
                        <circle cx="155" cy="95" fill="#6cf8bb" r="4" />
                        <circle cx="80" cy="105" fill="#6cf8bb" r="4" />
                        <circle cx="30" cy="80" fill="#6cf8bb" r="4" />
                      </svg>
                    </div>
                    <div className="flex items-center justify-between z-10 bg-inverse-surface/90 text-inverse-on-surface p-2 rounded-lg">
                      <div>
                        <span className="text-xs font-body-sm text-body-sm block text-surface-container-highest">Live Calculated Area</span>
                        <span className="font-headline-md text-headline-md font-bold text-secondary-fixed">3.48 Hectares</span>
                      </div>
                      <button className="px-3 py-1.5 bg-secondary text-on-secondary rounded text-xs font-label-md text-label-md hover:bg-primary transition-all flex items-center gap-1" type="button">
                        <Icon name="flag" className="text-sm" />
                        <span>Drop Waypoint</span>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 bg-surface-container-lowest rounded-lg shadow-sm">
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Perimeter</span>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold">812 meters</span>
                    </div>
                    <div className="p-3 bg-surface-container-lowest rounded-lg shadow-sm">
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Satellite Fix</span>
                      <span className="font-headline-sm text-headline-sm text-secondary font-bold">14 Sats (GNSS)</span>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0 text-on-surface-variant relative overflow-hidden">
                    <img className="w-full h-full object-cover rounded-lg" data-alt="Close up photographic portrait of a smiling middle-aged Nigerian farmer in rural agricultural attire during daylight field session with lush farm background" src="/images/screens/722639a830c2.webp" alt="" loading="lazy" decoding="async" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-label-md text-label-md text-on-surface font-bold">Farmer Portrait Capture</span>
                      <span className="text-secondary font-label-sm text-label-sm flex items-center gap-1"><Icon name="check_circle" className="text-sm" /> Attached</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">NIN facial matching tolerance: 98.2% verified.</p>
                  </div>
                  <button className="p-2.5 bg-surface-container-low rounded-lg text-on-surface hover:bg-surface-container" title="Retake Photo" type="button">
                    <Icon name="photo_camera" className="text-lg" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        ))}
        {slot(slots, "roster", (
          <section className="bg-surface-container-lowest rounded-xl shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-container">
              <div>
                <h2 className="font-headline-lg text-headline-lg text-on-surface">Community Farmer Portfolio &amp; Intake Roster</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1">Recent assisted onboarding cases across Iseyin, Ado-Awaye, and Oke-Ogun South zones.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Icon name="filter_alt" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm" />
                  <select className="pl-9 pr-8 py-2 bg-surface-container-low rounded-lg text-on-surface font-label-md text-label-md focus:outline-none cursor-pointer">
                    <option>All Communities (4 Zones)</option>
                    <option>Ado-Awaye Village</option>
                    <option>Odo-Ogun Community</option>
                    <option>Iseyin East Cluster</option>
                  </select>
                </div>
                <button className="flex items-center gap-1.5 px-3 py-2 bg-surface-container text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container-high transition-all" type="button">
                  <Icon name="download" className="text-base" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                    <th className="py-3 px-4 rounded-l-lg">Case ID &amp; Farmer</th>
                    <th className="py-3 px-4">Community Location</th>
                    <th className="py-3 px-4">Primary Enterprise</th>
                    <th className="py-3 px-4">Mapped Land</th>
                    <th className="py-3 px-4">Verification Tier</th>
                    <th className="py-3 px-4">Incentive</th>
                    <th className="py-3 px-4">Sync Status</th>
                    <th className="py-3 px-4 rounded-r-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container font-body-sm text-body-sm text-on-surface">
                  <tr className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-bold">Alhaji Rasheed Adeleke</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">#FMR-2026-089 • +234 803 112 4091</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-on-surface-variant">
                      <div className="flex items-center gap-1.5">
                        <Icon name="place" className="text-secondary text-base" />
                        <span>Ado-Awaye Village</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface">Cassava / Maize</span>
                    </td>
                    <td className="py-4 px-4 font-headline-sm text-headline-sm font-semibold">5.0 Ha</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Tier 2 Payout-Ready</span>
                    </td>
                    <td className="py-4 px-4 font-label-md text-label-md text-primary font-bold">₦3,500</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm"><Icon name="cloud_done" className="text-base" /> Synced</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant" title="View Dossier" type="button">
                          <Icon name="visibility" className="text-base" />
                        </button>
                        <button className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant" title="Edit GPS Polygon" type="button">
                          <Icon name="edit_location" className="text-base" />
                        </button>
                        <button className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant" title="Log Farm Visit" type="button">
                          <Icon name="add_task" className="text-base" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-bold">Madam Folashade Alabi</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">#FMR-2026-090 • +234 812 770 1933</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-on-surface-variant">
                      <div className="flex items-center gap-1.5">
                        <Icon name="place" className="text-secondary text-base" />
                        <span>Odo-Ogun Community</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface">Tomato Roma VF</span>
                    </td>
                    <td className="py-4 px-4 font-headline-sm text-headline-sm font-semibold">2.5 Ha</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Tier 1 Verified</span>
                    </td>
                    <td className="py-4 px-4 font-label-md text-label-md text-primary font-bold">₦2,250</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm"><Icon name="cloud_done" className="text-base" /> Synced</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant" title="View Dossier" type="button">
                          <Icon name="visibility" className="text-base" />
                        </button>
                        <button className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant" title="Edit GPS Polygon" type="button">
                          <Icon name="edit_location" className="text-base" />
                        </button>
                        <button className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant" title="Log Farm Visit" type="button">
                          <Icon name="add_task" className="text-base" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-bold">Babatunde Ogundipe</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">#FMR-2026-091 • +234 705 889 0211</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-on-surface-variant">
                      <div className="flex items-center gap-1.5">
                        <Icon name="place" className="text-secondary text-base" />
                        <span>Iseyin East Outskirts</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface">Cowpea &amp; Soy</span>
                    </td>
                    <td className="py-4 px-4 font-headline-sm text-headline-sm font-semibold">8.0 Ha</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm"><span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> Pending BVN match</span>
                    </td>
                    <td className="py-4 px-4 font-label-md text-label-md text-on-surface-variant font-bold">₦5,000</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm"><Icon name="sync_problem" className="text-base" /> Queued Locally</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant" title="View Dossier" type="button">
                          <Icon name="visibility" className="text-base" />
                        </button>
                        <button className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant" title="Edit GPS Polygon" type="button">
                          <Icon name="edit_location" className="text-base" />
                        </button>
                        <button className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant" title="Log Farm Visit" type="button">
                          <Icon name="add_task" className="text-base" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-bold">Funke Balogun</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">#FMR-2026-092 • +234 814 621 9904</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-on-surface-variant">
                      <div className="flex items-center gap-1.5">
                        <Icon name="place" className="text-secondary text-base" />
                        <span>Oke-Ola Farm Settlement</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface">Poultry (500 Broilers)</span>
                    </td>
                    <td className="py-4 px-4 font-headline-sm text-headline-sm font-semibold">1.8 Ha</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Tier 2 Payout-Ready</span>
                    </td>
                    <td className="py-4 px-4 font-label-md text-label-md text-primary font-bold">₦1,900</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm"><Icon name="cloud_done" className="text-base" /> Synced</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant" title="View Dossier" type="button">
                          <Icon name="visibility" className="text-base" />
                        </button>
                        <button className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant" title="Edit GPS Polygon" type="button">
                          <Icon name="edit_location" className="text-base" />
                        </button>
                        <button className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant" title="Log Farm Visit" type="button">
                          <Icon name="add_task" className="text-base" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        ))}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-surface-container-lowest p-6 rounded-xl shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-surface-container rounded-lg text-secondary">
                  <Icon name="hub" className="text-xl" />
                </span>
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">Clustered Harrowing Demand Queue</h3>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Machine Syndicate Aggregation Module</span>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-secondary-container text-on-secondary-container rounded-full font-label-sm text-label-sm font-semibold">Dispatch Ready</span>
            </div>
            <div className="bg-surface-container-low p-4 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-label-md text-label-md text-on-surface font-bold block">Cluster #CL-ODO-04 (Odo-Ogun 3km Radius)</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">4 contiguous smallholders pooled to eliminate tractor mobilization overhead</span>
                </div>
                <div className="text-right">
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">16.0 Ha Total</span>
                  <span className="block font-label-sm text-label-sm text-secondary">Saves ₦45,000 in transit</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-label-sm text-label-sm text-on-surface-variant">
                  <span>Aggregated Capacity: 16 Ha of 15 Ha Target</span>
                  <span className="text-secondary font-bold">100% Met</span>
                </div>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div className="bg-secondary h-2 rounded-full" style={{ width: "100%" }} />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">Assigned Smallholders in Group:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-label-md text-label-md">
                <div className="p-2.5 bg-surface-container-low rounded-lg flex justify-between items-center">
                  <span>Madam Folashade Alabi</span>
                  <span className="font-bold text-on-surface">2.5 Ha</span>
                </div>
                <div className="p-2.5 bg-surface-container-low rounded-lg flex justify-between items-center">
                  <span>Yekini Bello</span>
                  <span className="font-bold text-on-surface">4.0 Ha</span>
                </div>
                <div className="p-2.5 bg-surface-container-low rounded-lg flex justify-between items-center">
                  <span>Kafayat Ajayi</span>
                  <span className="font-bold text-on-surface">3.5 Ha</span>
                </div>
                <div className="p-2.5 bg-surface-container-low rounded-lg flex justify-between items-center">
                  <span>Elder Samuel Oguntola</span>
                  <span className="font-bold text-on-surface">6.0 Ha</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-surface-container-lowest border border-surface-container rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary font-bold">
                  <Icon name="precision_manufacturing" className="text-lg" />
                </div>
                <div>
                  <span className="font-label-md text-label-md text-on-surface font-semibold block">Matched: Alhaji Kazeem Tractor Syndicate</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">MF 375 (75 HP) + Heavy Disc Harrow • Available Tomorrow</span>
                </div>
              </div>
              <button className="w-full sm:w-auto px-4 py-2 bg-primary-container text-on-primary rounded-lg font-label-md text-label-md shadow-sm hover:bg-primary transition-all whitespace-nowrap" type="button">Dispatch Job (Escrow Funded)</button>
            </div>
          </div>
          <div className="lg:col-span-5 bg-surface-container-lowest p-6 rounded-xl shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <Icon name="wifi_off" className="text-secondary" />
                <h3 className="font-headline-md text-headline-md text-on-surface">Offline Queue Engine</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface">SQLite Active</span>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low">
              <div className="w-12 h-12 rounded-xl bg-surface-container-lowest shadow-sm flex items-center justify-center text-secondary">
                <Icon name="sync" className="text-2xl" />
              </div>
              <div className="flex-1">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">14 Forms Pending</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Will auto-stream to Master Node when signal reaches 3G/4G or Wi-Fi.</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-on-surface">
                  <Icon name="person" className="text-secondary text-base" />
                  <span>NIN Biometric Registrations</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface font-semibold">6 items</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-on-surface">
                  <Icon name="map" className="text-secondary text-base" />
                  <span>GPS Boundary Polygons</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface font-semibold">5 items</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-on-surface">
                  <Icon name="receipt_long" className="text-secondary text-base" />
                  <span>Service Booking Commitments</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface font-semibold">3 items</span>
              </div>
            </div>
            <div className="pt-3 border-t border-surface-container space-y-3">
              <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                <span>Local Storage Cache Used:</span>
                <span className="text-on-surface font-semibold">18.4 MB of 512 MB</span>
              </div>
              <button className="w-full py-2.5 px-4 bg-surface-container text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container-high transition-all flex items-center justify-center gap-2" type="button">
                <Icon name="cloud_upload" className="text-base" />
                <span>Force Network Handshake</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
