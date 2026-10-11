// Ported from the "machinery_services_directory_cultivanode" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";

export function MachineryDirectory(_props: ScreenProps) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <section className="w-full bg-surface-container-low py-space-md">
          <div className="max-w-7xl mx-auto px-margin-desktop flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface-variant flex-wrap">
              <a className="hover:text-primary transition-colors flex items-center gap-1" href="#">
                <Icon name="home" className="text-[16px]" />
                <span>Mesh Portal</span>
              </a>
              <span className="text-outline-variant">/</span>
              <span className="text-on-surface-variant">Regional Operations</span>
              <span className="text-outline-variant">/</span>
              <span className="text-primary font-semibold">Machinery &amp; Services Hub</span>
            </div>
            <div className="inline-flex items-center gap-space-xs self-start md:self-auto bg-surface-container-lowest px-space-md py-1 rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">South-West Pilot Mechanization Mesh · 0% Platform Commission</span>
            </div>
          </div>
        </section>
        <section className="w-full bg-surface-container-lowest shadow-sm py-space-xl">
          <div className="max-w-7xl mx-auto px-margin-desktop flex flex-col gap-space-lg">
            <div className="flex flex-col gap-space-xs max-w-4xl">
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight">Find Verified Farm Machinery &amp; Skilled Agricultural Services</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">Discover, book, and deploy vetted tractor syndicates, combine harvesters, boom sprayers, and certified field operators across Oyo, Ogun, Osun, Ondo, Ekiti, and Lagos. Backed by GPS-geofenced Proof-of-Work and CBN escrow custody.</p>
            </div>
            <div className="w-full bg-surface-container-low p-space-md rounded-xl shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-space-md items-end" role="form">
                <div className="lg:col-span-4 flex flex-col gap-space-xs">
                  <label className="font-label-sm text-label-sm text-on-surface-variant uppercase flex items-center gap-1"><Icon name="agriculture" className="text-[14px] text-secondary" /> Service Category</label>
                  <div className="relative bg-surface-container-lowest rounded-lg">
                    <select defaultValue="tillage" className="w-full h-10 px-space-md font-body-sm text-body-sm text-on-surface bg-transparent appearance-none rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="all">All Vetted Agrarian Operations</option>
                      <option value="tillage">Tractor Tillage &amp; Disc Ridging</option>
                      <option value="clearing">Heavy Land Clearing &amp; Stumping</option>
                      <option value="spraying">Calibrated Tractor Boom Spraying</option>
                      <option value="drone">Drone Precision Spraying (DJI Agras)</option>
                      <option value="harvesting">Combine Harvesting (Rice, Maize, Soy)</option>
                      <option value="scouting">Soil pH &amp; Precision Agronomy Scouting</option>
                      <option value="manual">Manual Certified Pruning Gangs</option>
                    </select>
                    <Icon name="expand_more" className="absolute right-3 top-2.5 text-on-surface-variant pointer-events-none text-[18px]" />
                  </div>
                </div>
                <div className="lg:col-span-3 flex flex-col gap-space-xs">
                  <label className="font-label-sm text-label-sm text-on-surface-variant uppercase flex items-center gap-1"><Icon name="distance" className="text-[14px] text-secondary" /> Agrarian Cluster / LGA</label>
                  <div className="relative bg-surface-container-lowest rounded-lg">
                    <select defaultValue="oyo-saki" className="w-full h-10 px-space-md font-body-sm text-body-sm text-on-surface bg-transparent appearance-none rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="all">All SW Hubs (6 States)</option>
                      <option value="oyo-saki">Oyo — Saki West / Iseyin Belt</option>
                      <option value="oyo-ibadan">Oyo — Ibadan Central / Ido</option>
                      <option value="ogun-abeokuta">Ogun — Abeokuta North / Obafemi</option>
                      <option value="ogun-ijebu">Ogun — Ijebu-Ode / Sagamu</option>
                      <option value="osun-osogbo">Osun — Osogbo / Ilesa Cluster</option>
                      <option value="ondo-akure">Ondo — Akure / Owo Grain Hub</option>
                      <option value="ekiti-ado">Ekiti — Ado-Ekiti / Ikole</option>
                    </select>
                    <Icon name="expand_more" className="absolute right-3 top-2.5 text-on-surface-variant pointer-events-none text-[18px]" />
                  </div>
                </div>
                <div className="lg:col-span-3 flex flex-col gap-space-xs">
                  <label className="font-label-sm text-label-sm text-on-surface-variant uppercase flex items-center gap-1"><Icon name="calendar_today" className="text-[14px] text-secondary" /> Mobilization Window</label>
                  <div className="relative bg-surface-container-lowest rounded-lg">
                    <input className="w-full h-10 px-space-md font-body-sm text-body-sm text-on-surface bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" type="date" defaultValue="2025-04-10" />
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <button className="w-full h-10 inline-flex items-center justify-center gap-space-xs font-label-lg text-label-lg font-semibold bg-primary-container text-on-primary hover:bg-primary transition-all duration-150 rounded-lg shadow-sm" type="submit">
                    <Icon name="search" className="text-[18px]" />
                    <span>Find Fleet</span>
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-space-sm pt-space-md text-on-surface-variant font-label-sm text-label-sm">
                <span className="font-semibold text-on-surface">Live Filters:</span>
                <span className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed"><Icon name="check" className="text-[14px]" /> In-radius &lt;35km</span>
                <span className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full bg-surface-container text-on-surface">Operator Included</span>
                <span className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full bg-surface-container text-on-surface">GPS Telematics Active</span>
                <span className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full bg-surface-container text-on-surface">Fuel-included quotes</span>
                <button className="ml-auto text-secondary hover:underline font-semibold flex items-center gap-1" type="button"><Icon name="restart_alt" className="text-[14px]" /> Reset Filters</button>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full bg-surface py-space-lg">
          <div className="max-w-7xl mx-auto px-margin-desktop">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-md">
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase">Fleet Ready</span>
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="minor_crash" className="text-[18px]" />
                  </div>
                </div>
                <div>
                  <div className="font-metric-num text-metric-num text-primary">342</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">Active Tractors &amp; Implements</div>
                </div>
                <div className="mt-space-sm flex items-center gap-1 font-label-sm text-label-sm text-secondary">
                  <Icon name="trending_up" className="text-[14px]" />
                  <span>+28 joined this week</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase">Deployment SLA</span>
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                    <Icon name="speed" className="text-[18px]" />
                  </div>
                </div>
                <div>
                  <div className="font-metric-num text-metric-num text-primary">&lt;48h</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">Guaranteed Dispatch Window</div>
                </div>
                <div className="mt-space-sm flex items-center gap-1 font-label-sm text-label-sm text-secondary">
                  <Icon name="check_circle" className="text-[14px]" />
                  <span>Oyo &amp; Ogun Primary Corridors</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase">Pilot Commission</span>
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-tertiary">
                    <Icon name="percent" className="text-[18px]" />
                  </div>
                </div>
                <div>
                  <div className="font-metric-num text-metric-num text-primary">₦0 Fee</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">Platform Booking Commission</div>
                </div>
                <div className="mt-space-sm flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
                  <Icon name="verified" className="text-[14px] text-secondary" />
                  <span>Supported by SW ADP Subsidies</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase">Escrow Protocol</span>
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="security" className="text-[18px]" />
                  </div>
                </div>
                <div>
                  <div className="font-metric-num text-metric-num text-primary">100%</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">Geofenced PoW Validation</div>
                </div>
                <div className="mt-space-sm flex items-center gap-1 font-label-sm text-label-sm text-secondary">
                  <Icon name="lock" className="text-[14px]" />
                  <span>CBN-Regulated Escrow Vault</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-space-xl">
          <div className="max-w-7xl mx-auto px-margin-desktop flex flex-col gap-space-lg">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
              <div>
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Specialized Agricultural Capabilities</span>
                <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">Mechanization &amp; Agronomic Service Categories</h2>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">Standardized unit rates across South-West Nigeria clusters. Transparent hectare pricing with zero hidden contractor mobilization costs.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between group">
                <div className="flex flex-col gap-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
                    <Icon name="agriculture" className="text-[28px]" />
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Tractor Tillage &amp; Plowing</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Disc plows, heavy harrows, and cassava ridgers operated by vetted tractor operators. Calibrated depth control for optimal root aeration.</p>
                </div>
                <div className="mt-space-lg pt-space-sm bg-surface-container-low px-space-md py-space-sm rounded-lg flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Benchmark Rate:</span>
                  <span className="font-label-lg text-label-lg font-bold text-primary">From ₦18,500 / Ha</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between group">
                <div className="flex flex-col gap-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
                    <Icon name="construction" className="text-[28px]" />
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Land Preparation &amp; Stumping</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Bulldozers (CAT D6/D7), hydraulic excavators, and root rippers engineered for virgin agrarian bush opening and secondary forest grading.</p>
                </div>
                <div className="mt-space-lg pt-space-sm bg-surface-container-low px-space-md py-space-sm rounded-lg flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Benchmark Rate:</span>
                  <span className="font-label-lg text-label-lg font-bold text-primary">From ₦45,000 / Ha</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between group">
                <div className="flex flex-col gap-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
                    <Icon name="shower" className="text-[28px]" />
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Crop Protection &amp; Spraying</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Calibrated 600L-800L tractor boom sprayers alongside DJI Agras T30/T40 drones for rapid, drift-minimized herbicide and insecticide passes.</p>
                </div>
                <div className="mt-space-lg pt-space-sm bg-surface-container-low px-space-md py-space-sm rounded-lg flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Benchmark Rate:</span>
                  <span className="font-label-lg text-label-lg font-bold text-primary">From ₦6,500 / Ha</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between group">
                <div className="flex flex-col gap-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
                    <Icon name="grain" className="text-[28px]" />
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Grain &amp; Tuber Harvesting</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Mechanical cassava uprooters and multi-crop combines with specialized rice track undercarriages and maize headers for minimum grain shatter.</p>
                </div>
                <div className="mt-space-lg pt-space-sm bg-surface-container-low px-space-md py-space-sm rounded-lg flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Benchmark Rate:</span>
                  <span className="font-label-lg text-label-lg font-bold text-primary">From ₦24,000 / Ha</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between group">
                <div className="flex flex-col gap-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
                    <Icon name="biotech" className="text-[28px]" />
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Soil Testing &amp; Agronomy Scouting</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Mobile field test labs equipped with electronic pH, NPK, and electrical conductivity testing kits. Verified fertilizer optimization prescriptions.</p>
                </div>
                <div className="mt-space-lg pt-space-sm bg-surface-container-low px-space-md py-space-sm rounded-lg flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Benchmark Rate:</span>
                  <span className="font-label-lg text-label-lg font-bold text-primary">From ₦12,000 / Field</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between group">
                <div className="flex flex-col gap-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
                    <Icon name="local_shipping" className="text-[28px]" />
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Haulage &amp; Low-Loader Transport</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Heavy equipment low-bed mobilization trailers for point-to-point tractor and bulldozer haulage between inter-state farm clusters.</p>
                </div>
                <div className="mt-space-lg pt-space-sm bg-surface-container-low px-space-md py-space-sm rounded-lg flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Benchmark Rate:</span>
                  <span className="font-label-lg text-label-lg font-bold text-primary">₦1,800 / Km loaded</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full bg-surface-container-low py-space-xl">
          <div className="max-w-7xl mx-auto px-margin-desktop flex flex-col gap-space-lg">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
              <div>
                <div className="flex items-center gap-space-xs">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Certified Machinery Fleet</span>
                </div>
                <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">Active Mobilization Directory</h2>
              </div>
              <div className="flex items-center gap-space-sm font-label-sm text-label-sm text-on-surface-variant">
                <span>Sort by:</span>
                <button className="bg-surface-container-lowest px-space-sm py-1 rounded-md text-primary font-semibold shadow-sm flex items-center gap-1" type="button">Fastest Availability <Icon name="arrow_drop_down" className="text-[14px]" /></button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
              <article className="bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
                <div className="relative w-full h-48 bg-surface-container">
                  <img className="w-full h-full object-cover" data-alt="Red Massey Ferguson 375 4WD farm tractor parked near an open arable field in Saki Oyo State, under bright equatorial daylight. Professional agribusiness machinery photograph showcasing heavy tread tires and 3-disc plow attachment with crisp clean operational readiness." src="/images/screens/3da3cb4ce8df.webp" alt="" loading="lazy" decoding="async" />
                  <div className="absolute top-3 left-3 bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-space-sm py-0.5 rounded-full font-semibold flex items-center gap-1 shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Available Tomorrow</div>
                  <div className="absolute bottom-3 right-3 bg-surface-container-lowest/95 backdrop-blur-sm text-primary font-label-md text-label-md px-space-sm py-0.5 rounded-md font-bold shadow-sm flex items-center gap-1">
                    <Icon name="star" className="text-tertiary-container text-[16px]" />
                    <span>4.9</span>
                    <span className="text-on-surface-variant font-normal">(38 jobs)</span>
                  </div>
                </div>
                <div className="p-space-lg flex flex-col flex-1 justify-between gap-space-md">
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                      <Icon name="location_on" className="text-[16px] text-secondary" />
                      <span>Saki, Oyo State · 35km radius</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Massey Ferguson 375 4WD (75 HP) + Baldan 3-Disc Plow</h3>
                    <p className="font-label-sm text-label-sm text-on-surface-variant font-medium">Syndicate: Saki West Tractor Syndicate #04</p>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-1">
                    <div className="flex items-center justify-between text-body-sm font-body-sm">
                      <span className="text-on-surface-variant">Operator:</span>
                      <span className="font-semibold text-on-surface flex items-center gap-1">Jimoh Rasaq <Icon name="verified" className="text-secondary text-[14px]" /></span>
                    </div>
                    <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant">
                      <span>Credentials:</span>
                      <span className="text-secondary font-medium">NIN Tier 2 · 340+ hrs logged</span>
                    </div>
                    <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant pt-1 border-t border-surface-container">
                      <span>Features:</span>
                      <span className="text-on-surface">GPS PoW · Fuel: Owner Provided</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-space-xs">
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Hectare Charge:</span>
                      <span className="font-headline-md text-headline-md text-primary font-bold">₦18,500</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">/ Ha</span>
                    </div>
                    <button className="inline-flex items-center justify-center gap-1 bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md px-space-md py-2 rounded-lg font-semibold transition-colors shadow-sm" type="button"><Icon name="lock" className="text-[16px]" /> Request Booking</button>
                  </div>
                </div>
              </article>
              <article className="bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
                <div className="relative w-full h-48 bg-surface-container">
                  <img className="w-full h-full object-cover" data-alt="Green and yellow John Deere 5075E utility tractor attached to modern 24-row precision planting rig and dry fertilizer hopper in an Ogun state farm estate near Abeokuta, clean agricultural engineering precision." src="/images/screens/d89e4436a812.webp" alt="" loading="lazy" decoding="async" />
                  <div className="absolute top-3 left-3 bg-surface-container-highest text-on-surface font-label-sm text-label-sm px-space-sm py-0.5 rounded-full font-semibold flex items-center gap-1 shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> In 2 Days</div>
                  <div className="absolute bottom-3 right-3 bg-surface-container-lowest/95 backdrop-blur-sm text-primary font-label-md text-label-md px-space-sm py-0.5 rounded-md font-bold shadow-sm flex items-center gap-1">
                    <Icon name="star" className="text-tertiary-container text-[16px]" />
                    <span>4.8</span>
                    <span className="text-on-surface-variant font-normal">(24 jobs)</span>
                  </div>
                </div>
                <div className="p-space-lg flex flex-col flex-1 justify-between gap-space-md">
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                      <Icon name="location_on" className="text-[16px] text-secondary" />
                      <span>Abeokuta North, Ogun State</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-primary font-bold">John Deere 5075E + 24-Row Precision Planter &amp; Applicator</h3>
                    <p className="font-label-sm text-label-sm text-on-surface-variant font-medium">Syndicate: Abeokuta Agrotech Coop</p>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-1">
                    <div className="flex items-center justify-between text-body-sm font-body-sm">
                      <span className="text-on-surface-variant">Lead Operator:</span>
                      <span className="font-semibold text-on-surface flex items-center gap-1">Segun Oladipo <Icon name="verified" className="text-secondary text-[14px]" /></span>
                    </div>
                    <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant">
                      <span>Credentials:</span>
                      <span className="text-secondary font-medium">Certified Mechanization Lead</span>
                    </div>
                    <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant pt-1 border-t border-surface-container">
                      <span>Features:</span>
                      <span className="text-on-surface">Sub-meter RTK Guidance · Operator Inc.</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-space-xs">
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Hectare Charge:</span>
                      <span className="font-headline-md text-headline-md text-primary font-bold">₦22,000</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">/ Ha</span>
                    </div>
                    <button className="inline-flex items-center justify-center gap-1 bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md px-space-md py-2 rounded-lg font-semibold transition-colors shadow-sm" type="button"><Icon name="lock" className="text-[16px]" /> Request Booking</button>
                  </div>
                </div>
              </article>
              <article className="bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
                <div className="relative w-full h-48 bg-surface-container">
                  <img className="w-full h-full object-cover" data-alt="High tech commercial DJI Agras T40 agricultural multicopter drone poised on landing platform in an agricultural cluster in Ibadan Oyo State. Features dual centrifugal atomizers and high capacity tank in sharp modern tech focus." src="/images/screens/241d95c6e3e4.webp" alt="" loading="lazy" decoding="async" />
                  <div className="absolute top-3 left-3 bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-space-sm py-0.5 rounded-full font-semibold flex items-center gap-1 shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Available Today</div>
                  <div className="absolute bottom-3 right-3 bg-surface-container-lowest/95 backdrop-blur-sm text-primary font-label-md text-label-md px-space-sm py-0.5 rounded-md font-bold shadow-sm flex items-center gap-1">
                    <Icon name="star" className="text-tertiary-container text-[16px]" />
                    <span>5.0</span>
                    <span className="text-on-surface-variant font-normal">(52 jobs)</span>
                  </div>
                </div>
                <div className="p-space-lg flex flex-col flex-1 justify-between gap-space-md">
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                      <Icon name="location_on" className="text-[16px] text-secondary" />
                      <span>Ibadan Central, Oyo (All SW States Coverage)</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-primary font-bold">DJI Agras T40 Agricultural Drone Fleet (Atomized Spray)</h3>
                    <p className="font-label-sm text-label-sm text-on-surface-variant font-medium">Provider: GreenPulse Precision Services</p>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-1">
                    <div className="flex items-center justify-between text-body-sm font-body-sm">
                      <span className="text-on-surface-variant">Pilot:</span>
                      <span className="font-semibold text-on-surface flex items-center gap-1">Engr. F. Adeleke <Icon name="verified" className="text-secondary text-[14px]" /></span>
                    </div>
                    <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant">
                      <span>Credentials:</span>
                      <span className="text-secondary font-medium">CAA Licensed Drone Operator</span>
                    </div>
                    <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant pt-1 border-t border-surface-container">
                      <span>Specs:</span>
                      <span className="text-on-surface">40L Payload · NDVI Contour Flight</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-space-xs">
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Precision Rate:</span>
                      <span className="font-headline-md text-headline-md text-primary font-bold">₦8,000</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">/ Ha (Chems excl.)</span>
                    </div>
                    <button className="inline-flex items-center justify-center gap-1 bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md px-space-md py-2 rounded-lg font-semibold transition-colors shadow-sm" type="button"><Icon name="lock" className="text-[16px]" /> Request Booking</button>
                  </div>
                </div>
              </article>
              <article className="bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
                <div className="relative w-full h-48 bg-surface-container">
                  <img className="w-full h-full object-cover" data-alt="Heavy yellow New Holland combine harvester operating across open cereal fields in Iseyin Oyo State, equipped with broad grain collection header under clear bright skies." src="/images/screens/197b7e7689de.webp" alt="" loading="lazy" decoding="async" />
                  <div className="absolute top-3 left-3 bg-surface-container-highest text-on-surface font-label-sm text-label-sm px-space-sm py-0.5 rounded-full font-semibold flex items-center gap-1 shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> Next Week (Early Maize)</div>
                  <div className="absolute bottom-3 right-3 bg-surface-container-lowest/95 backdrop-blur-sm text-primary font-label-md text-label-md px-space-sm py-0.5 rounded-md font-bold shadow-sm flex items-center gap-1">
                    <Icon name="star" className="text-tertiary-container text-[16px]" />
                    <span>4.7</span>
                    <span className="text-on-surface-variant font-normal">(19 jobs)</span>
                  </div>
                </div>
                <div className="p-space-lg flex flex-col flex-1 justify-between gap-space-md">
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                      <Icon name="location_on" className="text-[16px] text-secondary" />
                      <span>Iseyin LGA, Oyo State</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-primary font-bold">New Holland TC5.30 Combine (Rice &amp; Maize Headers)</h3>
                    <p className="font-label-sm text-label-sm text-on-surface-variant font-medium">Syndicate: Oke-Ogun Grain Cluster Fleet</p>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-1">
                    <div className="flex items-center justify-between text-body-sm font-body-sm">
                      <span className="text-on-surface-variant">Master Operator:</span>
                      <span className="font-semibold text-on-surface flex items-center gap-1">Tunde Balogun <Icon name="verified" className="text-secondary text-[14px]" /></span>
                    </div>
                    <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant">
                      <span>Threshing Yield:</span>
                      <span className="text-secondary font-medium">&lt;1.8% Grain Loss Guarantee</span>
                    </div>
                    <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant pt-1 border-t border-surface-container">
                      <span>Header Inclusions:</span>
                      <span className="text-on-surface">5-Row Maize Header &amp; Cutterbar</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-space-xs">
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Harvest Rate:</span>
                      <span className="font-headline-md text-headline-md text-primary font-bold">₦28,000</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">/ Ha</span>
                    </div>
                    <button className="inline-flex items-center justify-center gap-1 bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md px-space-md py-2 rounded-lg font-semibold transition-colors shadow-sm" type="button"><Icon name="lock" className="text-[16px]" /> Request Booking</button>
                  </div>
                </div>
              </article>
              <article className="bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
                <div className="relative w-full h-48 bg-surface-container">
                  <img className="w-full h-full object-cover" data-alt="Sturdy yellow Caterpillar CAT D6R crawler bulldozer clearing thick vegetative bushland and tree roots in Akure Ondo state, displaying heavy steel tracks and ripper shank in industrial farm development." src="/images/screens/cbc74d8061bf.webp" alt="" loading="lazy" decoding="async" />
                  <div className="absolute top-3 left-3 bg-surface-container-highest text-on-surface font-label-sm text-label-sm px-space-sm py-0.5 rounded-full font-semibold flex items-center gap-1 shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> In 3 Days</div>
                  <div className="absolute bottom-3 right-3 bg-surface-container-lowest/95 backdrop-blur-sm text-primary font-label-md text-label-md px-space-sm py-0.5 rounded-md font-bold shadow-sm flex items-center gap-1">
                    <Icon name="star" className="text-tertiary-container text-[16px]" />
                    <span>4.9</span>
                    <span className="text-on-surface-variant font-normal">(15 clearings)</span>
                  </div>
                </div>
                <div className="p-space-lg flex flex-col flex-1 justify-between gap-space-md">
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                      <Icon name="location_on" className="text-[16px] text-secondary" />
                      <span>Akure, Ondo State</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Heavy Bulldozer CAT D6R (Land Stumping &amp; Ripping)</h3>
                    <p className="font-label-sm text-label-sm text-on-surface-variant font-medium">Provider: Western Infrastructure &amp; Agro Syndicate</p>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-1">
                    <div className="flex items-center justify-between text-body-sm font-body-sm">
                      <span className="text-on-surface-variant">Lead Heavy Operator:</span>
                      <span className="font-semibold text-on-surface flex items-center gap-1">Sunday Ogundipe <Icon name="verified" className="text-secondary text-[14px]" /></span>
                    </div>
                    <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant">
                      <span>Task Specialization:</span>
                      <span className="text-secondary font-medium">Virgin Forest Bush Stumping</span>
                    </div>
                    <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant pt-1 border-t border-surface-container">
                      <span>Mobilization:</span>
                      <span className="text-on-surface">Low-Bed Dispatch via Escrow</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-space-xs">
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Stumping Rate:</span>
                      <span className="font-headline-md text-headline-md text-primary font-bold">₦55,000</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">/ Ha</span>
                    </div>
                    <button className="inline-flex items-center justify-center gap-1 bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md px-space-md py-2 rounded-lg font-semibold transition-colors shadow-sm" type="button"><Icon name="lock" className="text-[16px]" /> Request Booking</button>
                  </div>
                </div>
              </article>
              <article className="bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
                <div className="relative w-full h-48 bg-surface-container">
                  <img className="w-full h-full object-cover" data-alt="Coordinated team of certified agricultural farm workers wearing uniform protective gear and calibrated backpack sprayers inspecting a healthy green cassava plantation in Ogbomoso Oyo State under natural morning sunlight." src="/images/screens/18d7fa5591fb.webp" alt="" loading="lazy" decoding="async" />
                  <div className="absolute top-3 left-3 bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-space-sm py-0.5 rounded-full font-semibold flex items-center gap-1 shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Available Daily</div>
                  <div className="absolute bottom-3 right-3 bg-surface-container-lowest/95 backdrop-blur-sm text-primary font-label-md text-label-md px-space-sm py-0.5 rounded-md font-bold shadow-sm flex items-center gap-1">
                    <Icon name="star" className="text-tertiary-container text-[16px]" />
                    <span>4.8</span>
                    <span className="text-on-surface-variant font-normal">(41 jobs)</span>
                  </div>
                </div>
                <div className="p-space-lg flex flex-col flex-1 justify-between gap-space-md">
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                      <Icon name="location_on" className="text-[16px] text-secondary" />
                      <span>Ogbomoso South, Oyo State</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Certified Mobile Spray Gang &amp; Scouting (5 Persons)</h3>
                    <p className="font-label-sm text-label-sm text-on-surface-variant font-medium">Provider: Oyo ADP Accredited Pruning &amp; Spray Gang</p>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-1">
                    <div className="flex items-center justify-between text-body-sm font-body-sm">
                      <span className="text-on-surface-variant">Team Lead:</span>
                      <span className="font-semibold text-on-surface flex items-center gap-1">Kazeem Alao <Icon name="verified" className="text-secondary text-[14px]" /></span>
                    </div>
                    <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant">
                      <span>Accreditation:</span>
                      <span className="text-secondary font-medium">Safe Chemical Handling (ADP Cert)</span>
                    </div>
                    <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant pt-1 border-t border-surface-container">
                      <span>Capacity:</span>
                      <span className="text-on-surface">Up to 12 Hectares / Day</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-space-xs">
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Labor Rate:</span>
                      <span className="font-headline-md text-headline-md text-primary font-bold">₦6,000</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">/ Ha</span>
                    </div>
                    <button className="inline-flex items-center justify-center gap-1 bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md px-space-md py-2 rounded-lg font-semibold transition-colors shadow-sm" type="button"><Icon name="lock" className="text-[16px]" /> Request Booking</button>
                  </div>
                </div>
              </article>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md pt-space-md">
              <span className="font-body-sm text-body-sm text-on-surface-variant">Showing <strong>6</strong> of <strong>342</strong> verified mechanization listings across SW mesh</span>
              <div className="flex items-center gap-space-xs font-label-sm text-label-sm">
                <button className="w-8 h-8 rounded-lg bg-surface-container-lowest text-on-surface-variant shadow-sm flex items-center justify-center hover:bg-surface-container" disabled type="button">
                  <Icon name="chevron_left" className="text-[16px]" />
                </button>
                <button className="w-8 h-8 rounded-lg bg-primary-container text-on-primary font-bold flex items-center justify-center" type="button">1</button>
                <button className="w-8 h-8 rounded-lg bg-surface-container-lowest text-on-surface shadow-sm hover:bg-surface-container flex items-center justify-center" type="button">2</button>
                <button className="w-8 h-8 rounded-lg bg-surface-container-lowest text-on-surface shadow-sm hover:bg-surface-container flex items-center justify-center" type="button">3</button>
                <span className="px-1 text-on-surface-variant">...</span>
                <button className="w-8 h-8 rounded-lg bg-surface-container-lowest text-on-surface shadow-sm hover:bg-surface-container flex items-center justify-center" type="button">29</button>
                <button className="w-8 h-8 rounded-lg bg-surface-container-lowest text-on-surface-variant shadow-sm flex items-center justify-center hover:bg-surface-container" type="button">
                  <Icon name="chevron_right" className="text-[16px]" />
                </button>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full bg-surface-container-lowest py-space-xl">
          <div className="max-w-7xl mx-auto px-margin-desktop flex flex-col gap-space-lg">
            <div className="text-center max-w-2xl mx-auto flex flex-col gap-space-xs">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Decentralized Escrow Verification</span>
              <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">How Equipment Booking Works</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Every field operation is protected by geospatial Proof-of-Work boundaries and CBN-compliant custodial vaults.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md pt-space-md">
              <div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col justify-between gap-space-md relative">
                <div className="flex items-center justify-between">
                  <span className="font-headline-md text-headline-md font-bold text-secondary">01</span>
                  <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm">
                    <Icon name="polyline" className="text-[20px]" />
                  </div>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Define Geofenced Area</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Select your required implement and attach your PostGIS boundary polygon or farm GPS coordinates directly from your CultivaNode roster.</p>
                </div>
                <div className="text-secondary font-label-sm text-label-sm flex items-center gap-1">
                  <Icon name="pin_drop" className="text-[14px]" />
                  <span>Accurate Hectare Calculation</span>
                </div>
              </div>
              <div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col justify-between gap-space-md relative">
                <div className="flex items-center justify-between">
                  <span className="font-headline-md text-headline-md font-bold text-secondary">02</span>
                  <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm">
                    <Icon name="account_balance_wallet" className="text-[20px]" />
                  </div>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold">CBN Escrow Custody</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Deposit hiring funds into a Providus Bank escrow trust at 0% platform fee. Capital remains locked until field milestones are verified.</p>
                </div>
                <div className="text-secondary font-label-sm text-label-sm flex items-center gap-1">
                  <Icon name="shield" className="text-[14px]" />
                  <span>Zero Advance Risk</span>
                </div>
              </div>
              <div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col justify-between gap-space-md relative">
                <div className="flex items-center justify-between">
                  <span className="font-headline-md text-headline-md font-bold text-secondary">03</span>
                  <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm">
                    <Icon name="satellite_alt" className="text-[20px]" />
                  </div>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Track GPS Tillage PoW</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Tractor operator mobilizes. The on-board CultivaNode telemetry module transmits live boundary traversal tracks and time-stamped passes.</p>
                </div>
                <div className="text-secondary font-label-sm text-label-sm flex items-center gap-1">
                  <Icon name="timeline" className="text-[14px]" />
                  <span>Live Telematics Dashboard</span>
                </div>
              </div>
              <div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col justify-between gap-space-md relative">
                <div className="flex items-center justify-between">
                  <span className="font-headline-md text-headline-md font-bold text-secondary">04</span>
                  <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm">
                    <Icon name="fact_check" className="text-[20px]" />
                  </div>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Inspect &amp; Release Funds</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Review completed acreage. Farmer approves release via PIN/OTP within 48h or triggers an automated agricultural ADP arbitration review.</p>
                </div>
                <div className="text-secondary font-label-sm text-label-sm flex items-center gap-1">
                  <Icon name="verified" className="text-[14px]" />
                  <span>Instant Syndicate Payout</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-space-xl">
          <div className="max-w-7xl mx-auto px-margin-desktop">
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col lg:flex-row gap-space-lg items-center">
              <div className="w-full lg:w-1/2 flex flex-col gap-space-md">
                <div className="inline-flex items-center gap-space-xs bg-surface-container px-space-md py-1 rounded-full self-start">
                  <Icon name="hub" className="text-[16px] text-secondary" />
                  <span className="font-label-sm text-label-sm text-on-surface font-semibold">Active Mesh Coverage Map</span>
                </div>
                <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">South-West Tractor Syndicates Live Dispatch Map</h2>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">CultivaNode synchronizes fleet pools across agrarian junctions in Oyo, Ogun, Ondo, and Osun to eliminate empty return journeys (deadhead transit) and maintain fuel economies of scale.</p>
                <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
                  <div className="p-space-sm bg-surface-container-low rounded-lg">
                    <span className="font-label-sm text-label-sm text-on-surface-variant block">Oke-Ogun Corridor</span>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">142 Units</span>
                    <span className="font-label-sm text-label-sm text-secondary block">Saki, Iseyin, Kisi</span>
                  </div>
                  <div className="p-space-sm bg-surface-container-low rounded-lg">
                    <span className="font-label-sm text-label-sm text-on-surface-variant block">Egba / Yewa Belt</span>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">89 Units</span>
                    <span className="font-label-sm text-label-sm text-secondary block">Abeokuta, Ilaro</span>
                  </div>
                  <div className="p-space-sm bg-surface-container-low rounded-lg">
                    <span className="font-label-sm text-label-sm text-on-surface-variant block">Osun Agro Valley</span>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">64 Units</span>
                    <span className="font-label-sm text-label-sm text-secondary block">Osogbo, Ejigbo</span>
                  </div>
                  <div className="p-space-sm bg-surface-container-low rounded-lg">
                    <span className="font-label-sm text-label-sm text-on-surface-variant block">Ondo Grain Basin</span>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">47 Units</span>
                    <span className="font-label-sm text-label-sm text-secondary block">Akure, Owo</span>
                  </div>
                </div>
              </div>
              <div className="w-full lg:w-1/2">
                <div className="w-full h-80 rounded-xl bg-cover bg-center shadow-inner relative flex flex-col justify-end p-space-md" data-location="Ibadan, Nigeria" style={{ backgroundImage: "url('/images/screens/9107876e6c7f.webp')" }}>
                  <div className="bg-surface-container-lowest/90 backdrop-blur-md p-space-sm rounded-lg shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-primary font-semibold">
                      <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
                      <span>Live GPS Feed: 12 Machines operating right now in Saki West</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Updated 4m ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full pb-space-xl">
          <div className="max-w-7xl mx-auto px-margin-desktop">
            <div className="bg-primary-container text-on-primary rounded-xl p-space-lg lg:p-space-xl shadow-lg relative overflow-hidden">
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-lg">
                <div className="flex flex-col gap-space-sm max-w-2xl">
                  <div className="inline-flex items-center gap-space-xs bg-secondary/30 text-secondary-fixed font-label-sm text-label-sm px-space-md py-1 rounded-full uppercase tracking-wider font-semibold self-start"><Icon name="electric_bolt" className="text-[14px]" /> For Fleet Owners &amp; Agrotech Coops</div>
                  <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-primary font-bold tracking-tight">Own Tractors or Implements in South-West Nigeria? Put Idle Machines to Work.</h2>
                  <p className="font-body-md text-body-md text-on-primary-container leading-relaxed">Guaranteed escrow payments, zero deadhead transit via demand clustering, verified operator management, and subsidized maintenance spare parts through regional agricultural development programs.</p>
                  <div className="flex flex-wrap items-center gap-space-md pt-space-xs font-label-sm text-label-sm text-on-primary">
                    <span className="flex items-center gap-1"><Icon name="verified" className="text-secondary-fixed text-[18px]" /> 0% Listing Fee</span>
                    <span className="flex items-center gap-1"><Icon name="shield" className="text-secondary-fixed text-[18px]" /> Instant 48h Escrow Settlements</span>
                    <span className="flex items-center gap-1"><Icon name="engineering" className="text-secondary-fixed text-[18px]" /> Operator Safety &amp; GPS Telematics Kits</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row lg:flex-col gap-space-sm w-full lg:w-auto shrink-0">
                  <button className="w-full sm:w-auto inline-flex items-center justify-center gap-space-xs bg-secondary text-on-secondary hover:bg-secondary-fixed hover:text-on-secondary-fixed font-label-lg text-label-lg font-bold px-space-lg py-space-sm rounded-lg transition-colors shadow-sm" type="button"><Icon name="add_circle" className="text-[20px]" /> Register as Equipment Provider</button>
                  <button className="w-full sm:w-auto inline-flex items-center justify-center gap-space-xs bg-surface-container-lowest text-on-surface hover:bg-surface-container font-label-lg text-label-lg font-semibold px-space-lg py-space-sm rounded-lg transition-colors shadow-sm" type="button"><Icon name="download" className="text-[20px]" /> Download Operator Handbook (PDF)</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
