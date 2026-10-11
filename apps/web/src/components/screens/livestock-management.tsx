// Ported from the "livestock_management_aquaculture_engine" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";

export function LivestockManagement(_props: ScreenProps) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full space-y-space-xl pb-space-xl">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-lg bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
          <div className="flex flex-col space-y-space-xs">
            <div className="flex flex-wrap items-center gap-space-sm">
              <span className="font-headline-lg text-headline-lg text-primary tracking-tight">Livestock Management &amp; Aquaculture Engine</span>
              <div className="flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                <span>Multi-Enterprise Batch Monitoring</span>
              </div>
              <div className="flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm">
                <Icon name="verified_user" className="text-sm text-primary" />
                <span>Biosecurity Level 1 Protocols</span>
              </div>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">High-density livestock telemetry, feed ration conversion analytics, and veterinary cold-chain supervision across the Iseyin Cluster.</p>
          </div>
          <div className="flex flex-wrap items-center gap-space-sm">
            <button className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg transition-colors shadow-sm" type="button">
              <Icon name="add_circle" className="text-base text-primary" />
              <span>Register New Batch</span>
            </button>
            <button className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg transition-colors shadow-sm" type="button">
              <Icon name="water_drop" className="text-base text-secondary" />
              <span>Log Feed &amp; Water</span>
            </button>
            <button className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg transition-colors shadow-sm" type="button">
              <Icon name="vaccines" className="text-base" />
              <span>Schedule Vet Visit</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-lg">
          <div className="flex flex-col justify-between bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Animal Inventory &amp; Biomass</span>
                <div className="mt-space-xs font-metric-num text-metric-num text-on-surface">4,650 <span className="font-label-md text-label-md text-on-surface-variant font-normal">Head</span></div>
              </div>
              <div className="p-2 rounded-lg bg-surface-container-low text-primary">
                <Icon name="pets" />
              </div>
            </div>
            <div className="mt-space-md space-y-space-xs">
              <div className="flex items-center justify-between font-label-md text-label-md">
                <span className="text-on-surface">Estimated Biomass</span>
                <span className="font-bold text-primary">2.84 MT</span>
              </div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: "78%" }} />
              </div>
              <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant pt-1">
                <span>1,250 Broilers · 3,400 Clarias</span>
                <span className="text-secondary font-semibold">+12.4% vs target</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Herd/Flock Livability</span>
                <div className="mt-space-xs font-metric-num text-metric-num text-on-surface">98.4% <span className="font-label-md text-label-md text-on-surface-variant font-normal">Livability</span></div>
              </div>
              <div className="p-2 rounded-lg bg-surface-container-low text-secondary">
                <Icon name="vital_signs" />
              </div>
            </div>
            <div className="mt-space-md space-y-space-xs">
              <div className="flex items-center justify-between font-label-md text-label-md">
                <span className="text-on-surface">Cumulative Mortality</span>
                <span className="font-bold text-on-surface">1.6% (15 Head)</span>
              </div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: "98.4%" }} />
              </div>
              <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant pt-1">
                <span>Benchmark Limit: 3.0%</span>
                <span className="text-secondary font-semibold">+0.8% vs regional</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Feed Conversion (FCR)</span>
                <div className="mt-space-xs font-metric-num text-metric-num text-on-surface">1.62 <span className="font-label-md text-label-md text-secondary font-semibold">(Tgt: 1.65)</span></div>
              </div>
              <div className="p-2 rounded-lg bg-surface-container-low text-tertiary-container">
                <Icon name="restaurant" />
              </div>
            </div>
            <div className="mt-space-md space-y-space-xs">
              <div className="flex items-center justify-between font-label-md text-label-md">
                <span className="text-on-surface">Feed Burn Rate</span>
                <span className="font-bold text-on-surface">160 kg/day</span>
              </div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div className="bg-tertiary-container h-full rounded-full" style={{ width: "48%" }} />
              </div>
              <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant pt-1">
                <span className="text-tertiary-container font-semibold">Feed Buffer: 4.8 Days</span>
                <span>768 kg In-Silo</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Biosecurity &amp; Health</span>
                <div className="mt-space-xs font-metric-num text-metric-num text-primary">100% <span className="font-label-md text-label-md text-on-surface-variant font-normal">Up to Date</span></div>
              </div>
              <div className="p-2 rounded-lg bg-surface-container-low text-primary">
                <Icon name="shield_with_heart" />
              </div>
            </div>
            <div className="mt-space-md space-y-space-xs">
              <div className="flex items-center justify-between font-label-md text-label-md">
                <span className="text-on-surface">Next Protocol</span>
                <span className="font-bold text-on-surface">NDV Lasota</span>
              </div>
              <div className="flex items-center gap-1.5 py-1 px-2 rounded bg-surface-container-low font-label-sm text-label-sm text-primary">
                <Icon name="ac_unit" className="text-xs" />
                <span>Cold-chain in 36h · Dr. Alabi</span>
              </div>
              <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant pt-0.5">
                <span>Pathogen Alerts: 0 Active</span>
                <span className="text-secondary font-semibold">Protocols Met</span>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-space-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-sm">
              <Icon name="dataset" className="text-primary text-xl" />
              <span className="font-headline-md text-headline-md text-on-surface">Active Production Batches</span>
            </div>
            <div className="font-label-sm text-label-sm text-on-surface-variant">Live telemetry linked via Iseyin Hub Node #3</div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-space-lg">
            <div className="flex flex-col bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
              <div className="relative h-48 w-full bg-surface-container-high overflow-hidden">
                <img className="w-full h-full object-cover" data-alt="Commercial poultry broiler house in rural South West Nigeria featuring organized feeding tracks, active Cobb 500 birds, high roof ventilation, warm daylight, and precision farming telemetry equipment." src="/images/screens/ba213cda6a3f.webp" alt="" loading="lazy" decoding="async" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/60 to-transparent p-space-md flex flex-col justify-end">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">Grower Stage · Week 4 (Day 28)</span>
                      <h3 className="mt-1 font-headline-md text-headline-md text-on-primary">Poultry House 1 · Broiler Batch B4</h3>
                      <p className="font-body-sm text-body-sm text-inverse-on-surface">Kuroiler / Cobb 500 Dual Strain · Stocked 28 Mar 2026</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <span className="font-label-sm text-label-sm text-inverse-on-surface uppercase">Est. Market Ready</span>
                      <div className="font-label-lg text-label-lg text-on-primary font-bold">14 Days (Day 42)</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-space-lg space-y-space-lg flex-1 flex flex-col justify-between">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm">
                  <div className="p-space-sm bg-surface-container-low rounded-lg">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Flock Count</span>
                    <div className="font-label-lg text-label-lg text-on-surface font-bold">1,235 <span className="text-label-sm text-on-surface-variant font-normal">/ 1,250</span></div>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">98.8% Live</span>
                  </div>
                  <div className="p-space-sm bg-surface-container-low rounded-lg">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Avg Live Weight</span>
                    <div className="font-label-lg text-label-lg text-on-surface font-bold">1.35 kg</div>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">+0.05kg target</span>
                  </div>
                  <div className="p-space-sm bg-surface-container-low rounded-lg">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Feed Intake</span>
                    <div className="font-label-lg text-label-lg text-on-surface font-bold">142 kg/d</div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Finisher Pellets</span>
                  </div>
                  <div className="p-space-sm bg-surface-container-low rounded-lg">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Batch FCR</span>
                    <div className="font-label-lg text-label-lg text-on-surface font-bold text-primary">1.62</div>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">Optimal</span>
                  </div>
                </div>
                <div className="p-space-md bg-surface-container-low rounded-lg space-y-space-sm">
                  <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface font-semibold">
                    <span className="flex items-center gap-1.5 text-primary"><Icon name="sensors" className="text-sm" /> House Microclimate Telemetry</span>
                    <span className="text-on-surface-variant">Updated 4 mins ago</span>
                  </div>
                  <div className="grid grid-cols-3 gap-space-sm text-center">
                    <div className="bg-surface-container-lowest p-2 rounded">
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Temperature</div>
                      <div className="font-label-lg text-label-lg text-on-surface font-bold">28.2°C</div>
                      <span className="text-secondary font-label-sm text-label-sm">In Range (26-29)</span>
                    </div>
                    <div className="bg-surface-container-lowest p-2 rounded">
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Humidity</div>
                      <div className="font-label-lg text-label-lg text-on-surface font-bold">64%</div>
                      <span className="text-secondary font-label-sm text-label-sm">Optimal</span>
                    </div>
                    <div className="bg-surface-container-lowest p-2 rounded">
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Ammonia (NH₃)</div>
                      <div className="font-label-lg text-label-lg text-on-surface font-bold">&lt; 10 ppm</div>
                      <span className="text-secondary font-label-sm text-label-sm">Safe (&lt; 20)</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-space-sm p-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-sm text-body-sm">
                  <Icon name="medical_services" className="text-primary text-lg" />
                  <div className="flex-1"><span className="font-semibold text-primary">Upcoming Biosecurity Dose:</span> NDV Lasota Booster set for tomorrow 07:00 WAT by Dr. Alabi. Cold-chain storage at Hub validated at 3.8°C.</div>
                  <span className="px-2 py-0.5 rounded bg-surface-container-lowest font-label-sm text-label-sm font-semibold text-primary">Pending</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-space-sm pt-2">
                  <div className="flex items-center gap-1 font-label-sm text-label-sm text-tertiary-container font-semibold">
                    <Icon name="inventory_2" className="text-sm" />
                    <span>Feed buffer: 4 days remaining</span>
                  </div>
                  <div className="flex items-center gap-space-sm">
                    <button className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors" type="button">Mortality Log</button>
                    <button className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors" type="button">Weight Sampling</button>
                    <button className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md transition-colors" type="button">Log Daily Roster</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
              <div className="relative h-48 w-full bg-surface-container-high overflow-hidden">
                <img className="w-full h-full object-cover" data-alt="Commercial earthen catfish aquaculture ponds in Oyo State Nigeria with motorized paddlewheel aerators operating in clean water, surrounded by tropical green foliage and technical sampling docks." src="/images/screens/dd8e14f40c8e.webp" alt="" loading="lazy" decoding="async" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/60 to-transparent p-space-md flex flex-col justify-end">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">Grow-Out · Month 2</span>
                      <h3 className="mt-1 font-headline-md text-headline-md text-on-primary">Aquaculture Unit · Catfish Pond P2</h3>
                      <p className="font-body-sm text-body-sm text-inverse-on-surface">Clarias Gariepinus (African Sharptooth) · Stocked 15 Feb 2026</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <span className="font-label-sm text-label-sm text-inverse-on-surface uppercase">Harvest Window</span>
                      <div className="font-label-lg text-label-lg text-on-primary font-bold">~65 Days</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-space-lg space-y-space-lg flex-1 flex flex-col justify-between">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm">
                  <div className="p-space-sm bg-surface-container-low rounded-lg">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Juvenile Head</span>
                    <div className="font-label-lg text-label-lg text-on-surface font-bold">3,400 <span className="text-label-sm text-on-surface-variant font-normal">Head</span></div>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">Zero Die-off</span>
                  </div>
                  <div className="p-space-sm bg-surface-container-low rounded-lg">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Est. Biomass</span>
                    <div className="font-label-lg text-label-lg text-on-surface font-bold">1.15 MT</div>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">+180kg/mo</span>
                  </div>
                  <div className="p-space-sm bg-surface-container-low rounded-lg">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Avg Weight</span>
                    <div className="font-label-lg text-label-lg text-on-surface font-bold">0.34 kg</div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Last sample 3d</span>
                  </div>
                  <div className="p-space-sm bg-surface-container-low rounded-lg">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Daily Ration</span>
                    <div className="font-label-lg text-label-lg text-on-surface font-bold text-primary">18.0 kg</div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">4mm Floating</span>
                  </div>
                </div>
                <div className="p-space-md bg-surface-container-low rounded-lg space-y-space-sm">
                  <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface font-semibold">
                    <span className="flex items-center gap-1.5 text-primary"><Icon name="waves" className="text-sm" /> Pond P2 Water Quality Probe Telemetry</span>
                    <span className="text-on-surface-variant">Continuous probe #AQ-2</span>
                  </div>
                  <div className="grid grid-cols-4 gap-space-sm text-center">
                    <div className="bg-surface-container-lowest p-2 rounded">
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Water Temp</div>
                      <div className="font-label-lg text-label-lg text-on-surface font-bold">27.5°C</div>
                      <span className="text-secondary font-label-sm text-label-sm">Optimal</span>
                    </div>
                    <div className="bg-surface-container-lowest p-2 rounded">
                      <div className="font-label-sm text-label-sm text-on-surface-variant">DO₂ Level</div>
                      <div className="font-label-lg text-label-lg text-on-surface font-bold">6.2 mg/L</div>
                      <span className="text-secondary font-label-sm text-label-sm">Aerator ON</span>
                    </div>
                    <div className="bg-surface-container-lowest p-2 rounded">
                      <div className="font-label-sm text-label-sm text-on-surface-variant">pH Balance</div>
                      <div className="font-label-lg text-label-lg text-on-surface font-bold">7.1</div>
                      <span className="text-secondary font-label-sm text-label-sm">Neutral</span>
                    </div>
                    <div className="bg-surface-container-lowest p-2 rounded">
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Ammonia (NH₃)</div>
                      <div className="font-label-lg text-label-lg text-on-surface font-bold">0.02 mg/L</div>
                      <span className="text-secondary font-label-sm text-label-sm">Very Low</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-space-sm p-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-sm text-body-sm">
                  <Icon name="biotech" className="text-primary text-lg" />
                  <div className="flex-1"><span className="font-semibold text-primary">Biometric Health Check:</span> Robust dorsal pigmentation, high feed response at 08:30 and 17:00, 0 parasitic lesions detected during randomized 50-fish net sample.</div>
                  <span className="px-2 py-0.5 rounded bg-surface-container-lowest font-label-sm text-label-sm font-semibold text-secondary">Healthy</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-space-sm pt-2">
                  <div className="flex items-center gap-1 font-label-sm text-label-sm text-secondary font-semibold">
                    <Icon name="schedule" className="text-sm" />
                    <span>Next split feed: 17:00 WAT (9.0 kg)</span>
                  </div>
                  <div className="flex items-center gap-space-sm">
                    <button className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors" type="button">Water Parameters</button>
                    <button className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors" type="button">Sampling Log</button>
                    <button className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md transition-colors" type="button">Feeding Schedule</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          <div className="lg:col-span-7 flex flex-col bg-surface-container-lowest rounded-xl shadow-sm p-space-lg space-y-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <Icon name="grain" className="text-primary text-xl" />
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Feed Formulation &amp; Inventory Synchronization</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Live sync with Cluster Silos and local milling operations (§3.5 D)</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">Cost: ₦680 / kg</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">
                    <th className="py-2.5 px-space-md rounded-l">Component</th>
                    <th className="py-2.5 px-space-md">Ration Share (%)</th>
                    <th className="py-2.5 px-space-md">Source / Quality</th>
                    <th className="py-2.5 px-space-md">Batch Status</th>
                    <th className="py-2.5 px-space-md rounded-r text-right">In Silo</th>
                  </tr>
                </thead>
                <tbody className="font-body-sm text-body-sm text-on-surface divide-y divide-surface-container-low">
                  <tr className="hover:bg-surface-container-lowest transition-colors">
                    <td className="py-3 px-space-md font-semibold">Yellow Maize (Locally Milled)</td>
                    <td className="py-3 px-space-md">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">52%</span>
                        <div className="w-16 bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full" style={{ width: "52%" }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-space-md text-on-surface-variant">Iseyin Cooperative Harvest</td>
                    <td className="py-3 px-space-md">
                      <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">Moisture 12.1%</span>
                    </td>
                    <td className="py-3 px-space-md text-right font-bold">1,840 kg</td>
                  </tr>
                  <tr className="hover:bg-surface-container-lowest transition-colors">
                    <td className="py-3 px-space-md font-semibold">Soya Meal (Full-Fat Extruded)</td>
                    <td className="py-3 px-space-md">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">28%</span>
                        <div className="w-16 bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full" style={{ width: "28%" }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-space-md text-on-surface-variant">Protein 44% min</td>
                    <td className="py-3 px-space-md">
                      <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">Passed QA</span>
                    </td>
                    <td className="py-3 px-space-md text-right font-bold">620 kg</td>
                  </tr>
                  <tr className="hover:bg-surface-container-lowest transition-colors">
                    <td className="py-3 px-space-md font-semibold">Fishmeal / Animal Concentrate</td>
                    <td className="py-3 px-space-md">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">6%</span>
                        <div className="w-16 bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full" style={{ width: "6%" }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-space-md text-on-surface-variant">Marine concentrate 65% CP</td>
                    <td className="py-3 px-space-md">
                      <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">Lot #FM-44</span>
                    </td>
                    <td className="py-3 px-space-md text-right font-bold">140 kg</td>
                  </tr>
                  <tr className="hover:bg-surface-container-lowest transition-colors">
                    <td className="py-3 px-space-md font-semibold">Broiler Premix, Lysine &amp; Methionine</td>
                    <td className="py-3 px-space-md">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">14%</span>
                        <div className="w-16 bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full" style={{ width: "14%" }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-space-md text-on-surface-variant">Fortified micro-nutrients</td>
                    <td className="py-3 px-space-md">
                      <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">Sealed Drums</span>
                    </td>
                    <td className="py-3 px-space-md text-right font-bold">95 kg</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="p-space-md bg-surface-container-low rounded-lg flex flex-col md:flex-row items-center justify-between gap-space-md">
              <div className="flex items-center gap-space-sm">
                <svg className="w-12 h-12 text-primary" fill="none" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeOpacity="0.2" strokeWidth="4" />
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeDasharray="125.6" strokeDashoffset="25.1" strokeLinecap="round" strokeWidth="4" />
                </svg>
                <div>
                  <div className="font-label-md text-label-md text-on-surface font-bold">FCR Efficiency Curve: 1.62</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">0.03 points better than breed standard (1.65). Saving ₦42,000/week in rations.</div>
                </div>
              </div>
              <div className="flex items-center gap-space-sm bg-surface-container-lowest p-2.5 rounded-lg shadow-sm">
                <div>
                  <div className="font-label-sm text-label-sm text-tertiary-container font-semibold">Low Stock Threshold in 4.8d</div>
                  <div className="font-label-md text-label-md text-on-surface font-bold">Reorder 14 Bags (700 kg)</div>
                </div>
                <button className="px-3 py-1.5 rounded bg-tertiary-container hover:bg-tertiary text-on-tertiary font-label-sm text-label-sm font-semibold transition-colors" type="button">Order Rations</button>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 flex flex-col bg-surface-container-lowest rounded-xl shadow-sm p-space-lg space-y-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <Icon name="vaccines" className="text-primary text-xl" />
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Veterinary &amp; Cold-Chain</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Biosecurity schedule (§3.5 E)</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary" /> Zero Pathogens</span>
            </div>
            <div className="space-y-space-md flex-1">
              <div className="relative pl-6 pb-space-md border-l-2 border-primary">
                <span className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-secondary-container" />
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-primary font-bold">Upcoming Protocol</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Tomorrow · 07:00 WAT</span>
                </div>
                <h4 className="font-label-lg text-label-lg text-on-surface font-semibold mt-1">NDV Lasota Booster Vaccination</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Target flock: Broiler House 1 (1,235 birds). Administration via non-chlorinated well water drinking system.</p>
                <div className="mt-space-xs flex flex-wrap items-center gap-space-xs font-label-sm text-label-sm">
                  <span className="px-2 py-0.5 rounded bg-surface-container-low text-on-surface font-semibold">Attending: Dr. Alabi</span>
                  <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-semibold flex items-center gap-1"><Icon name="check_circle" className="text-xs" /> Hub Fridge 3.8°C</span>
                </div>
              </div>
              <div className="relative pl-6 pb-space-md border-l-2 border-surface-container-high">
                <span className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-secondary" />
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-secondary font-bold">Completed &amp; Signed</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">10 April 2026</span>
                </div>
                <h4 className="font-label-lg text-label-lg text-on-surface font-semibold mt-1">Gumboro (IBD) 2nd Dose Administration</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Verified vial batch #GB-2026-901. Zero adverse flock reactions observed in 48h observation window.</p>
                <div className="mt-space-xs font-label-sm text-label-sm text-on-surface-variant">Dr. Alabi · Verified Digital Signature</div>
              </div>
              <div className="relative pl-6 border-l-2 border-transparent">
                <span className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-surface-container-high" />
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface font-bold">Aquaculture Conditioning</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">08 April 2026</span>
                </div>
                <h4 className="font-label-lg text-label-lg text-on-surface font-semibold mt-1">AquaSafe Bio-Enzyme Application</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Probiotic sediment digest inoculated across Pond P2 to prevent organic waste build-up and ammonia spikes.</p>
                <div className="mt-space-xs font-label-sm text-label-sm text-secondary font-semibold">Bacterial count optimal · Ammonia: 0.02 mg/L</div>
              </div>
            </div>
            <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between font-label-sm text-label-sm">
              <div className="flex items-center gap-2 text-on-surface">
                <Icon name="verified" className="text-secondary text-base" />
                <span className="font-semibold">Zero Active Drug Withdrawal Restrictions</span>
              </div>
              <span className="text-on-surface-variant">Safe for commercial sale</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md p-space-md bg-surface-container-lowest rounded-xl shadow-sm text-on-surface font-body-sm text-body-sm">
          <div className="flex items-center gap-space-sm">
            <div className="w-3 h-3 rounded-full bg-secondary animate-pulse" />
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="font-label-md text-label-md font-bold text-primary">PowerSync SQLite Offline Engine</span>
              <span className="text-on-surface-variant">All 4,650 livestock telemetry &amp; health records cached in local SQLite store.</span>
            </div>
          </div>
          <div className="flex items-center gap-space-md font-label-sm text-label-sm text-on-surface-variant">
            <span>Database rev: <strong>#LS-2026.04-OYO</strong></span>
            <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-semibold">Fully Synced</span>
          </div>
        </div>
      </div>
    </div>
  );
}
