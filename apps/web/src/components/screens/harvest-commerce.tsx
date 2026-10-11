// Ported from the "produce_harvest_commerce_hub" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogAction, ScreenDialogClose } from "@/components/ds/screen-dialog";
import type { ScreenProps } from "./types";

export function HarvestCommerce(_props: ScreenProps) {
  const panelNewLotModal = (
    <div className="w-full max-w-xl rounded-xl bg-surface-container-lowest shadow-2xl overflow-hidden flex flex-col">
        <div className="p-space-md bg-surface-container-lowest flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="post_add" className="text-primary text-xl" />
            <h3 className="font-headline-md text-headline-md text-on-surface">List New Harvest Lot</h3>
          </div>
          <ScreenDialogClose><button className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface" id="close-lot-modal" type="button">
              <Icon name="close" className="text-lg" />
            </button></ScreenDialogClose>
        </div>
        <div className="p-space-lg flex flex-col gap-space-md bg-surface overflow-y-auto max-h-[819px]">
          <div>
            <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">Crop or Commodity Name</label>
            <input className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm shadow-sm focus:outline-none" placeholder="e.g. DMR-LSR-Y Yellow Maize, Roma Tomatoes" type="text" />
          </div>
          <div className="grid grid-cols-2 gap-space-sm">
            <div>
              <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">Harvest Parcel / Field</label>
              <input className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm shadow-sm focus:outline-none" placeholder="Plot A1, B2 Plateau" type="text" />
            </div>
            <div>
              <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">Available Quantity</label>
              <input className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm shadow-sm focus:outline-none" placeholder="e.g. 25.0 MT or 150 Crates" type="text" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-space-sm">
            <div>
              <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">Certified Moisture / Brix</label>
              <input className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm shadow-sm focus:outline-none" placeholder="e.g. 12.2% or 4.9° Brix" type="text" />
            </div>
            <div>
              <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">Asking Farmgate (₦)</label>
              <input className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm shadow-sm focus:outline-none" placeholder="₦ per MT or per Crate" type="text" />
            </div>
          </div>
          <div>
            <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">Target Pickup Window</label>
            <input className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm shadow-sm focus:outline-none" type="date" defaultValue="2026-06-01" />
          </div>
          <div className="p-3 rounded-lg bg-secondary-container/20 text-on-secondary-container font-label-sm text-label-sm flex items-center gap-2">
            <Icon name="verified" className="text-base" />
            <span>Automatic off-taker syndicated alert will dispatch to 14 verified corporate buyers upon publication.</span>
          </div>
        </div>
        <div className="p-space-md bg-surface-container-lowest flex items-center justify-end gap-space-sm">
          <ScreenDialogClose><button className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-high transition-colors" id="cancel-lot-btn" type="button">Cancel</button></ScreenDialogClose>
          <button className="px-5 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container transition-colors shadow-sm" id="save-lot-btn" type="button">Publish to Off-taker Hub</button>
        </div>
      </div>
  );
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <div className="px-space-md lg:px-space-xl py-space-lg flex flex-col gap-space-md">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md">
            <div className="flex flex-col min-w-0 max-w-3xl">
              <div className="flex flex-wrap items-center gap-space-xs mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold"><span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" /> PILOT 0% PLATFORM COMMISSION POLICY ACTIVE</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-medium"><Icon name="verified" className="text-[14px] text-secondary" /> Verified Direct Settlements</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight">Produce Commerce &amp; Off-taker Hub</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">B2B harvest off-take agreements, certified grading, cold-chain logistics, and farmgate forward contracts for Oyo State agro-clusters.</p>
            </div>
            <div className="flex flex-wrap items-center gap-space-sm shrink-0">
              <ScreenDialog title="List New Harvest Lot" side="center" panel={panelNewLotModal}>
                <button className="inline-flex items-center gap-2 px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg font-semibold hover:bg-primary-container transition-all shadow-md hover:shadow-lg" id="open-lot-modal" type="button">
                  <Icon name="add_circle" className="text-lg" />
                  <span>List New Harvest Lot</span>
                </button>
              </ScreenDialog>
              <button className="relative inline-flex items-center gap-2 px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-lg text-label-lg font-semibold shadow-sm hover:bg-surface-container-low transition-all" type="button">
                <Icon name="assignment_turned_in" className="text-lg text-secondary" />
                <span>Review Off-taker Contracts</span>
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full bg-secondary text-on-secondary font-label-sm text-label-sm font-bold">3</span>
              </button>
              <button className="inline-flex items-center gap-2 px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-lg text-label-lg font-semibold shadow-sm hover:bg-surface-container-low transition-all" type="button">
                <Icon name="download" className="text-lg text-on-surface-variant" />
                <span>Export Waybill (CSV)</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md mt-2">
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Available &amp; Forecast Produce</span>
                <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center">
                  <Icon name="grain" className="text-primary text-xl" />
                </div>
              </div>
              <div className="my-space-sm">
                <div className="flex items-baseline gap-2">
                  <span className="font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg text-primary font-bold tracking-tight">186.5</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface-variant">MT</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm mt-1">
                  <Icon name="local_shipping" className="text-[13px] text-secondary" />
                  <span>+24 MT ready for pickup • 4 commodities</span>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Maize, Tomato Roma, Cassava Tubers, Smoked Catfish</p>
            </div>
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Forward Contracts Value</span>
                <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center">
                  <Icon name="handshake" className="text-secondary text-xl" />
                </div>
              </div>
              <div className="my-space-sm">
                <div className="flex items-baseline gap-1">
                  <span className="font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg text-on-surface font-bold tracking-tight">₦14,850,000</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm mt-1">
                  <Icon name="domain" className="text-[13px] text-primary" />
                  <span>3 contracted corporate off-takers</span>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Grand Cereals, Mile 12 Hub, Psaltry Int&apos;l</p>
            </div>
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Avg Farmgate Settlement</span>
                <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center">
                  <Icon name="trending_up" className="text-primary text-xl" />
                </div>
              </div>
              <div className="my-space-sm">
                <div className="flex items-baseline gap-1">
                  <span className="font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg text-on-surface font-bold tracking-tight">₦385,000</span>
                  <span className="font-body-md text-body-md text-on-surface-variant">/ MT avg</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold mt-1">
                  <Icon name="arrow_upward" className="text-[14px]" />
                  <span>+14.2% vs. local spot open market</span>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Direct aggregation bypasses middle-tier broker cut</p>
            </div>
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Fulfillment &amp; Quality Score</span>
                <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center">
                  <Icon name="verified_user" className="text-secondary text-xl" />
                </div>
              </div>
              <div className="my-space-sm">
                <div className="flex items-baseline gap-2">
                  <span className="font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg text-secondary font-bold tracking-tight">99.1%</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Grade A</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm mt-1">
                  <Icon name="check_circle" className="text-[13px] text-secondary" />
                  <span>Zero rejected deliveries to date</span>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Oyo State Certified Agronomist testing pipeline</p>
            </div>
          </div>
        </div>
        <div className="px-space-md lg:px-space-xl pb-space-xl grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          <div className="lg:col-span-8 flex flex-col gap-space-lg">
            <div className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden flex flex-col">
              <div className="p-space-lg bg-surface-container-lowest flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
                <div>
                  <div className="flex items-center gap-2">
                    <Icon name="inventory_2" className="text-primary text-xl" />
                    <h2 className="font-headline-md text-headline-md text-on-surface">Available Harvest Lots &amp; Quality Certifications</h2>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Aggregated field parcels with laboratory moisture, aflatoxin &amp; Brix metrics</p>
                </div>
                <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg shrink-0 overflow-x-auto" id="commodity-filters">
                  <button className="px-3 py-1 rounded bg-surface-container-lowest font-label-sm text-label-sm font-semibold text-primary shadow-sm filter-btn active-filter" data-category="all" type="button">All</button>
                  <button className="px-3 py-1 rounded font-label-sm text-label-sm font-medium text-on-surface-variant hover:text-on-surface filter-btn" data-category="grains" type="button">Grains</button>
                  <button className="px-3 py-1 rounded font-label-sm text-label-sm font-medium text-on-surface-variant hover:text-on-surface filter-btn" data-category="vegetables" type="button">Vegetables</button>
                  <button className="px-3 py-1 rounded font-label-sm text-label-sm font-medium text-on-surface-variant hover:text-on-surface filter-btn" data-category="tubers" type="button">Tubers</button>
                  <button className="px-3 py-1 rounded font-label-sm text-label-sm font-medium text-on-surface-variant hover:text-on-surface filter-btn" data-category="fish" type="button">Aquaculture</button>
                </div>
              </div>
              <div className="p-space-md flex flex-col gap-space-md bg-surface">
                <div className="lot-card p-space-md rounded-lg bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-space-md" data-category="grains">
                  <div className="w-full md:w-44 h-36 rounded-lg overflow-hidden shrink-0 relative bg-surface-container-high">
                    <img className="w-full h-full object-cover" data-alt="Golden ripe maize corn cobs harvested in sacks under sunlight at Iseyin farm in Oyo State with laboratory quality tag attached" src="/images/screens/4a8b9fc9b3d2.webp" alt="" loading="lazy" decoding="async" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-primary text-on-primary font-label-sm text-label-sm font-bold">HV-2026-081</span>
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-surface-container-lowest/90 backdrop-blur font-label-sm text-label-sm text-on-surface font-semibold">Plot A1 &amp; A2</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Yellow Maize (DMR-LSR-Y)</h3>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container/30 text-on-secondary-container font-label-sm text-label-sm font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> 2 Active Bids</span>
                        </div>
                        <div className="text-right">
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">Asking Farmgate</span>
                          <span className="font-headline-sm text-headline-sm text-primary font-bold">₦420,000 <span className="font-body-sm text-body-sm font-normal text-on-surface-variant">/ MT</span></span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 p-2.5 rounded-lg bg-surface-container-low">
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">Available Lot</span>
                          <span className="font-label-lg text-label-lg font-bold text-on-surface">48.0 MT</span>
                        </div>
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">Moisture Level</span>
                          <span className="font-label-lg text-label-lg font-bold text-secondary">12.5% (Certified)</span>
                        </div>
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">Aflatoxin Spec</span>
                          <span className="font-label-lg text-label-lg font-bold text-secondary">&lt;4 ppb (Grade A)</span>
                        </div>
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">Target Pickup</span>
                          <span className="font-label-lg text-label-lg font-bold text-on-surface">May 28, 2026</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2">
                      <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                        <Icon name="verified" className="text-sm text-secondary" />
                        <span>Tested by IITA-Certified Field Lab #04</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors" type="button">View Lab Sheet</button>
                        <button className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary-container transition-colors shadow-sm" type="button">Review Bids &amp; Accept (2)</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="lot-card p-space-md rounded-lg bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-space-md" data-category="vegetables">
                  <div className="w-full md:w-44 h-36 rounded-lg overflow-hidden shrink-0 relative bg-surface-container-high">
                    <img className="w-full h-full object-cover" data-alt="Crates of firm freshly harvested deep red Roma tomatoes stacked inside an evaporative cooling shelter in Oyo State" src="/images/screens/a9404bc26417.webp" alt="" loading="lazy" decoding="async" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-primary text-on-primary font-label-sm text-label-sm font-bold">HV-2026-094</span>
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-surface-container-lowest/90 backdrop-blur font-label-sm text-label-sm text-on-surface font-semibold">Plot B1 Lowland</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Tomato Roma VF (Table Grade)</h3>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold"><Icon name="schedule" className="text-[12px] text-primary" /> Pickup Tomorrow 06:00 WAT</span>
                        </div>
                        <div className="text-right">
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">Contracted Rate</span>
                          <span className="font-headline-sm text-headline-sm text-primary font-bold">₦18,500 <span className="font-body-sm text-body-sm font-normal text-on-surface-variant">/ Crate</span></span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 p-2.5 rounded-lg bg-surface-container-low">
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">Volume Ready</span>
                          <span className="font-label-lg text-label-lg font-bold text-on-surface">180 Crates (~9 MT)</span>
                        </div>
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">Brix Sugar Index</span>
                          <span className="font-label-lg text-label-lg font-bold text-on-surface">4.8° Brix</span>
                        </div>
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">Firmness Rating</span>
                          <span className="font-label-lg text-label-lg font-bold text-secondary">8.4 N (High Transit)</span>
                        </div>
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">Committed Off-taker</span>
                          <span className="font-label-lg text-label-lg font-bold text-primary truncate block">Mile 12 Consortium</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2">
                      <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
                        <Icon name="ac_unit" className="text-sm text-tertiary" />
                        <span>Staggered 3-day pick window • Cold chain dispatch pre-booked</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors" type="button">Inspect Crating Log</button>
                        <button className="px-3 py-1.5 rounded-lg bg-secondary text-on-secondary font-label-sm text-label-sm font-semibold hover:opacity-90 transition-opacity" type="button">Confirm Dispatch Call</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="lot-card p-space-md rounded-lg bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-space-md" data-category="tubers">
                  <div className="w-full md:w-44 h-36 rounded-lg overflow-hidden shrink-0 relative bg-surface-container-high">
                    <img className="w-full h-full object-cover" data-alt="Healthy freshly dug high-starch cassava roots piled in an agricultural yard ready for industrial starch processing in Oyo State" src="/images/screens/5b71fcf185e8.webp" alt="" loading="lazy" decoding="async" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-primary text-on-primary font-label-sm text-label-sm font-bold">HV-2026-062</span>
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-surface-container-lowest/90 backdrop-blur font-label-sm text-label-sm text-on-surface font-semibold">Plot B2 Plateau</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">High-Starch Cassava Roots (TME 419)</h3>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-medium">Factory Delivery Forward</span>
                        </div>
                        <div className="text-right">
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">Factory Contract</span>
                          <span className="font-headline-sm text-headline-sm text-primary font-bold">₦95,000 <span className="font-body-sm text-body-sm font-normal text-on-surface-variant">/ MT</span></span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 p-2.5 rounded-lg bg-surface-container-low">
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">Forecast Yield</span>
                          <span className="font-label-lg text-label-lg font-bold text-on-surface">110.0 MT</span>
                        </div>
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">Starch Dry Matter</span>
                          <span className="font-label-lg text-label-lg font-bold text-secondary">24.2% Content</span>
                        </div>
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">Factory Destination</span>
                          <span className="font-label-lg text-label-lg font-bold text-on-surface truncate block">Psaltry (Ado-Awaye)</span>
                        </div>
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">Delivery Window</span>
                          <span className="font-label-lg text-label-lg font-bold text-on-surface">June 15 - 20</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2">
                      <div className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
                        <Icon name="security" className="text-sm text-secondary" />
                        <span>Escrow Locked: ₦10,450,000 with Zenith Bank Commercial Trust</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors" type="button">Schedule Harvester Fleet</button>
                        <button className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary-container transition-colors" type="button">View Agreement #PS-48</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="lot-card p-space-md rounded-lg bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-space-md" data-category="fish">
                  <div className="w-full md:w-44 h-36 rounded-lg overflow-hidden shrink-0 relative bg-surface-container-high">
                    <img className="w-full h-full object-cover" data-alt="Plump African sharptooth catfish swimming in an earthen aquaculture growout pond during grading in Ibadan Nigeria" src="/images/screens/2b60dbf31abb.webp" alt="" loading="lazy" decoding="async" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-primary text-on-primary font-label-sm text-label-sm font-bold">HV-2026-018</span>
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-surface-container-lowest/90 backdrop-blur font-label-sm text-label-sm text-on-surface font-semibold">Pond P2 Growout</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">African Sharptooth Catfish (Clarias)</h3>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container/30 text-on-secondary-container font-label-sm text-label-sm font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Ready for Seining</span>
                        </div>
                        <div className="text-right">
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">Asking Spot Rate</span>
                          <span className="font-headline-sm text-headline-sm text-primary font-bold">₦2,650 <span className="font-body-sm text-body-sm font-normal text-on-surface-variant">/ kg live</span></span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 p-2.5 rounded-lg bg-surface-container-low">
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">Available Biomass</span>
                          <span className="font-label-lg text-label-lg font-bold text-on-surface">1.15 MT</span>
                        </div>
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">Average Size</span>
                          <span className="font-label-lg text-label-lg font-bold text-on-surface">950g – 1.2kg</span>
                        </div>
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">Processing Mode</span>
                          <span className="font-label-lg text-label-lg font-bold text-on-surface">Live Aerated / Smoked</span>
                        </div>
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">Target Market</span>
                          <span className="font-label-lg text-label-lg font-bold text-primary truncate block">Ibadan &amp; Abeokuta Grills</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2">
                      <div className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
                        <Icon name="water_drop" className="text-sm text-secondary" />
                        <span>Pure borehole water cycle • Zero chemical medication withdrawal period</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors" type="button">Weight Sample Log</button>
                        <button className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary-container transition-colors" type="button">Open Direct Bidding</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden flex flex-col">
              <div className="p-space-lg flex items-center justify-between bg-surface-container-lowest">
                <div className="flex items-center gap-2">
                  <Icon name="gavel" className="text-secondary text-xl" />
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface">Live Off-taker Bids &amp; Direct Settlement Queue</h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Direct corporate procurement offers pending farmer approval or negotiation</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-secondary animate-pulse" /> 2 Actionable Offers</span>
              </div>
              <div className="p-space-md grid grid-cols-1 md:grid-cols-2 gap-space-md bg-surface">
                <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary font-headline-sm text-headline-sm font-bold">GC</div>
                        <div>
                          <h3 className="font-headline-sm text-headline-sm text-on-surface">Grand Cereals Ltd</h3>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Jos &amp; Ibadan Feed Mill Plants</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold">Tier-1 Corporate</span>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-container-low mb-3 space-y-1.5">
                      <div className="flex justify-between text-body-sm font-body-sm">
                        <span className="text-on-surface-variant">Target Commodity:</span>
                        <span className="font-semibold text-on-surface">Yellow Maize DMR (40.0 MT)</span>
                      </div>
                      <div className="flex justify-between text-body-sm font-body-sm">
                        <span className="text-on-surface-variant">Offered Rate:</span>
                        <span className="font-bold text-primary">₦415,000 / MT</span>
                      </div>
                      <div className="flex justify-between text-body-sm font-body-sm">
                        <span className="text-on-surface-variant">Total Deal Value:</span>
                        <span className="font-headline-sm text-headline-sm font-bold text-on-surface">₦16,600,000</span>
                      </div>
                      <div className="flex justify-between text-body-sm font-body-sm">
                        <span className="text-on-surface-variant">Haulage Terms:</span>
                        <span className="font-medium text-secondary">Buyer supplies 30-MT articulated truck</span>
                      </div>
                      <div className="flex justify-between text-body-sm font-body-sm">
                        <span className="text-on-surface-variant">Payment Guarantee:</span>
                        <span className="text-on-surface">Direct Bank Transfer within 24h of Weighbridge</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm mb-4">
                      <Icon name="timer" className="text-[16px] text-tertiary" />
                      <span>Bid validity expires in <strong>14 hours 20 mins</strong></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button className="flex-1 py-2 px-3 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-high transition-colors text-center" type="button">Counter-Offer</button>
                    <button className="flex-1 py-2 px-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container transition-colors shadow-sm text-center" type="button">Accept &amp; Lock Quota</button>
                  </div>
                </div>
                <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary font-headline-sm text-headline-sm font-bold">FC</div>
                        <div>
                          <h3 className="font-headline-sm text-headline-sm text-on-surface">FoodCo Supermarkets</h3>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Ibadan Retail Central Distribution</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold">Fresh Retail</span>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-container-low mb-3 space-y-1.5">
                      <div className="flex justify-between text-body-sm font-body-sm">
                        <span className="text-on-surface-variant">Target Commodity:</span>
                        <span className="font-semibold text-on-surface">Tomato Roma VF (50 Crates)</span>
                      </div>
                      <div className="flex justify-between text-body-sm font-body-sm">
                        <span className="text-on-surface-variant">Offered Rate:</span>
                        <span className="font-bold text-secondary">₦19,000 / Crate delivered</span>
                      </div>
                      <div className="flex justify-between text-body-sm font-body-sm">
                        <span className="text-on-surface-variant">Total Deal Value:</span>
                        <span className="font-headline-sm text-headline-sm font-bold text-on-surface">₦950,000</span>
                      </div>
                      <div className="flex justify-between text-body-sm font-body-sm">
                        <span className="text-on-surface-variant">Quality Requirement:</span>
                        <span className="font-medium text-primary">Strict Grade A Unblemished Table Fresh</span>
                      </div>
                      <div className="flex justify-between text-body-sm font-body-sm">
                        <span className="text-on-surface-variant">Payment Terms:</span>
                        <span className="text-on-surface">Instant settlement on refrigerated dock arrival</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm mb-4">
                      <Icon name="local_shipping" className="text-[16px] text-secondary" />
                      <span>Requires chilled delivery into Ring Road Hub by 09:00</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button className="flex-1 py-2 px-3 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-high transition-colors text-center" type="button">Decline</button>
                    <button className="flex-1 py-2 px-3 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-semibold hover:opacity-90 transition-opacity shadow-sm text-center" type="button">Accept 50 Crates</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-space-lg">
            <div className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden flex flex-col">
              <div className="p-space-md bg-surface-container-lowest flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="commute" className="text-primary text-xl" />
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Logistics &amp; Cold-Chain Dispatch</h2>
                </div>
                <span className="font-label-sm text-label-sm text-secondary font-semibold">Active Fleet: 2</span>
              </div>
              <div className="p-space-md bg-surface flex flex-col gap-space-md">
                <div className="p-3 rounded-lg bg-surface-container-low flex items-center justify-between">
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant block">Haulage Syndicate</span>
                    <span className="font-label-md text-label-md font-bold text-on-surface">Oke-Ogun Agro-Logistics Consortium</span>
                  </div>
                  <Icon name="handshake" className="text-primary text-xl" />
                </div>
                <div className="p-3.5 rounded-lg bg-surface-container-lowest shadow-sm flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-surface-variant flex items-center justify-center">
                        <Icon name="ac_unit" className="text-secondary text-lg" />
                      </div>
                      <div>
                        <h4 className="font-label-md text-label-md font-bold text-on-surface">5-Tonne Chilled Box Truck</h4>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Lagos Fresh Route • Tomato Dispatch</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-bold">+12°C STABLE</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between font-label-sm text-label-sm">
                      <span className="text-on-surface-variant">Driver: Sunday Adeyemi</span>
                      <span className="text-primary font-semibold">+234 802 334 1199</span>
                    </div>
                    <div className="flex justify-between font-label-sm text-label-sm">
                      <span className="text-on-surface-variant">Status: Pre-cooling dock check</span>
                      <span className="text-secondary font-bold">Departure 06:00 WAT</span>
                    </div>
                  </div>
                  <div className="w-full h-32 rounded-lg bg-cover bg-center relative overflow-hidden mt-1" data-location="Iseyin, Oyo State, Nigeria" style={{ backgroundImage: "url('/images/screens/29ca1d80ef33.webp')" }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-inverse-on-surface">
                      <div className="flex items-center gap-1 font-label-sm text-label-sm">
                        <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-ping" />
                        <span className="truncate">Iseyin Aggregation Hub Depot #02</span>
                      </div>
                      <span className="font-label-sm text-label-sm bg-inverse-surface px-1.5 py-0.5 rounded text-white">GPS LIVE</span>
                    </div>
                  </div>
                </div>
                <div className="p-3.5 rounded-lg bg-surface-container-lowest shadow-sm flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center">
                        <Icon name="local_shipping" className="text-primary text-lg" />
                      </div>
                      <div>
                        <h4 className="font-label-md text-label-md font-bold text-on-surface">DAF 30-Tonne Bulk Tipper</h4>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Plate: OYO-482-BD • Cassava Run</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">Standby</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Mobilized for Psaltry Ado-Awaye Factory delivery schedule (June 15). Weighbridge pre-tare registered.</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden flex flex-col">
              <div className="p-space-md bg-surface-container-lowest flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="scale" className="text-primary text-xl" />
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Proof of Delivery &amp; Ledger</h2>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Digital weighbridge calibration tickets</span>
                  </div>
                </div>
              </div>
              <div className="p-space-md bg-surface flex flex-col gap-space-sm">
                <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Icon name="receipt_long" className="text-secondary text-base" />
                      <span className="font-label-md text-label-md font-bold text-on-surface">Waybill #WB-9824</span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold"><Icon name="done_all" className="text-[13px]" /> Reconciled</span>
                  </div>
                  <div className="space-y-1 my-1">
                    <div className="flex justify-between font-body-sm text-body-sm">
                      <span className="text-on-surface-variant">Delivered To:</span>
                      <span className="font-semibold text-on-surface">Premier Feed Mills, Oluyole Ibadan</span>
                    </div>
                    <div className="flex justify-between font-body-sm text-body-sm">
                      <span className="text-on-surface-variant">Commodity:</span>
                      <span className="text-on-surface">12.0 MT Yellow Feed Maize</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-surface-container-low grid grid-cols-3 gap-1 text-center">
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Gross Weight</span>
                      <span className="font-label-md text-label-md font-bold text-on-surface">28,420 kg</span>
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Tare Weight</span>
                      <span className="font-label-md text-label-md font-bold text-on-surface">16,420 kg</span>
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Net Certified</span>
                      <span className="font-label-md text-label-md font-bold text-primary">12,000 kg</span>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-secondary-container/20 flex items-center justify-between mt-1">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-secondary-container">Transfer Settled to Farm Books:</span>
                      <span className="font-headline-sm text-headline-sm font-bold text-primary">₦5,040,000</span>
                    </div>
                    <button className="px-2.5 py-1 rounded bg-surface-container-lowest text-primary font-label-sm text-label-sm font-semibold shadow-sm hover:bg-surface-container-low transition-colors" type="button">View Slip</button>
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm pt-1">
                    <span className="truncate">Timestamp: 2026-05-24 14:18:02 WAT</span>
                    <span className="font-mono text-[10px] text-outline">SHA: 8f7e...3d9a</span>
                  </div>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-label-md text-label-md font-semibold text-on-surface">Season Off-take Quota Target</span>
                    <span className="font-label-md text-label-md font-bold text-primary">78% Fulfilled</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: "78%" }} />
                  </div>
                  <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant mt-1.5">
                    <span>Target: 240 MT</span>
                    <span>Delivered: 187.2 MT</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mx-space-md lg:mx-space-xl mb-space-xl p-space-md rounded-xl bg-surface-container-low shadow-sm flex flex-col sm:flex-row items-center justify-between gap-space-sm text-on-surface-variant">
          <div className="flex items-center gap-2 min-w-0">
            <Icon name="sync_saved_locally" className="text-secondary text-lg" />
            <span className="font-body-sm text-body-sm truncate"><strong>PowerSync Protocol Active:</strong> SQLite offline database mirrored. Local cryptographic weighbridge stamp: <span className="font-mono text-xs">hash:c7b94a...e102</span></span>
          </div>
          <div className="flex items-center gap-3 shrink-0 font-label-sm text-label-sm">
            <span className="inline-flex items-center gap-1 text-secondary font-semibold"><span className="w-2 h-2 rounded-full bg-secondary" /> Cluster Online</span>
            <span>Oyo State Agro-Commerce Gateway v4.8</span>
          </div>
        </div>
      </div>
    </div>
  );
}
