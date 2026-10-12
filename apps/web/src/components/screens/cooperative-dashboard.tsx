// Ported from the "cooperative_management_dashboard_10.2" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";

export function CooperativeDashboard(_props: ScreenProps) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg shadow-sm mb-space-lg">
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-secondary-fixed/15 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-space-lg">
            <div className="flex flex-col gap-space-xs max-w-4xl">
              <div className="flex flex-wrap items-center gap-space-xs text-label-sm font-label-sm text-outline">
                <span className="px-space-xs py-0.5 rounded bg-primary-container text-on-primary-container font-semibold uppercase tracking-wider">Union Executive Desk §10.2</span>
                <span>·</span>
                <span className="text-on-surface-variant font-medium">FMAFS &amp; Oyo State Dept. of Co-operatives Reg: <strong className="text-on-surface">#OYO-COOP-2018-049</strong></span>
                <span>·</span>
                <span className="px-space-xs py-0.5 rounded bg-secondary-container text-on-secondary-container font-semibold">Tier-1 Apex Cooperative</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight mt-1">Oke-Ogun Agricultural Producers &amp; Smallholder Farmers Union</h1>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-space-md text-body-sm font-body-sm text-on-surface-variant mt-1">
                <span className="inline-flex items-center gap-1">
                  <Icon name="verified_user" className="text-[16px] text-secondary" />
                  <span>President: <strong className="text-on-surface font-semibold">Chief Adeleke Ogundimu</strong></span>
                </span>
                <span className="text-outline">/</span>
                <span className="inline-flex items-center gap-1">
                  <Icon name="assignment_ind" className="text-[16px] text-secondary" />
                  <span>General Secretary: <strong className="text-on-surface font-semibold">Mrs. Funmilayo Adewale</strong></span>
                </span>
                <span className="text-outline">/</span>
                <span className="inline-flex items-center gap-1">
                  <Icon name="eco" className="text-[16px] text-primary" />
                  <span>Extension Lead: <strong className="text-primary font-semibold">Quadri Olapade</strong></span>
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-sm self-start xl:self-center">
              <div className="flex flex-col px-space-md py-space-xs rounded-lg bg-surface-container text-left">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Territorial Jurisdiction</span>
                <span className="font-label-lg text-label-lg font-semibold text-on-surface">18 Village Societies &amp; Outgrower Zones</span>
                <span className="font-body-sm text-body-sm text-outline">Iseyin · Saki · Ago-Are · Otu · Okaka</span>
              </div>
              <div className="flex items-center gap-space-xs">
                {_props.slots?.actions ?? (
                  <>
                    <button className="h-10 px-space-md rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-lg text-label-lg transition-colors flex items-center gap-1.5 shadow-sm" type="button">
                      <Icon name="download" className="text-[18px]" />
                      <span>Audit Extract</span>
                    </button>
                    <button className="h-10 px-space-md rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg transition-colors flex items-center gap-1.5 shadow-sm" type="button">
                      <Icon name="add_circle" className="text-[18px]" />
                      <span>New Member Enrolment</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-space-md mb-space-lg">
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Member Registry</span>
              <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <Icon name="groups" className="text-[18px]" />
              </span>
            </div>
            <div className="mt-space-sm">
              <div className="font-metric-num text-metric-num text-on-surface tracking-tight">1,840</div>
              <div className="font-label-sm text-label-sm text-secondary font-semibold flex items-center gap-1 mt-0.5">
                <Icon name="check_circle" className="text-[14px]" />
                <span>100% NIN &amp; Biometric Verified</span>
              </div>
            </div>
            <div className="mt-space-sm pt-space-xs text-body-sm font-body-sm text-on-surface-variant flex justify-between bg-surface-container-low px-2 py-1 rounded">
              <span>Men: 1,420</span>
              <span className="font-semibold text-primary">Women: 420 (23%)</span>
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Aggregated Land</span>
              <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                <Icon name="crop_free" className="text-[18px]" />
              </span>
            </div>
            <div className="mt-space-sm">
              <div className="font-metric-num text-metric-num text-on-surface tracking-tight">3,450 <span className="font-label-md text-label-md text-outline">Ha</span></div>
              <div className="font-label-sm text-label-sm text-on-surface-variant mt-0.5"><strong className="text-primary font-semibold">2,890 Ha</strong> Under Cultivation</div>
            </div>
            <div className="mt-space-sm pt-space-xs text-body-sm font-body-sm text-on-surface-variant bg-surface-container-low px-2 py-1 rounded">
              <span>SAMMAZ-52, Cassava, Soy</span>
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Collective Forecast</span>
              <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-tertiary-container">
                <Icon name="warehouse" className="text-[18px]" />
              </span>
            </div>
            <div className="mt-space-sm">
              <div className="font-metric-num text-metric-num text-on-surface tracking-tight">14,200 <span className="font-label-md text-label-md text-outline">MT</span></div>
              <div className="font-label-sm text-label-sm text-secondary font-semibold mt-0.5">Gross Est: ₦1.68 Billion</div>
            </div>
            <div className="mt-space-sm pt-space-xs text-body-sm font-body-sm text-on-surface-variant bg-surface-container-low px-2 py-1 rounded truncate">
              <span>100% Binding Off-take Covers</span>
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Machinery Pool</span>
              <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <Icon name="precision_manufacturing" className="text-[18px]" />
              </span>
            </div>
            <div className="mt-space-sm">
              <div className="font-metric-num text-metric-num text-on-surface tracking-tight">94.2%</div>
              <div className="font-label-sm text-label-sm text-secondary font-semibold mt-0.5 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span>14 Tractors &amp; Harvesters</span>
              </div>
            </div>
            <div className="mt-space-sm pt-space-xs text-body-sm font-body-sm text-on-surface-variant bg-surface-container-low px-2 py-1 rounded">
              <span>Massey Ferguson Syndicate</span>
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Bulk Purchasing</span>
              <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                <Icon name="shopping_bag" className="text-[18px]" />
              </span>
            </div>
            <div className="mt-space-sm">
              <div className="font-metric-num text-metric-num text-on-surface tracking-tight">-18.5%</div>
              <div className="font-label-sm text-label-sm text-secondary font-semibold mt-0.5">₦42.8M Bulk Savings</div>
            </div>
            <div className="mt-space-sm pt-space-xs text-body-sm font-body-sm text-on-surface-variant bg-surface-container-low px-2 py-1 rounded">
              <span>Direct Factory Gate Bulk Rate</span>
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Treasury &amp; Vault</span>
              <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary-container">
                <Icon name="account_balance" className="text-[18px]" />
              </span>
            </div>
            <div className="mt-space-sm">
              <div className="font-metric-num text-metric-num text-on-surface tracking-tight">₦86.40M</div>
              <div className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Zenith Bank PLC Vault</div>
            </div>
            <div className="mt-space-sm pt-space-xs text-body-sm font-body-sm text-on-surface-variant bg-surface-container-low px-2 py-1 rounded truncate">
              <span>Escrow &amp; Guarantee Vault</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-space-xs p-1.5 bg-surface-container-lowest rounded-xl shadow-sm mb-space-lg">
          <button className="px-space-md py-2 rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg shadow-sm flex items-center gap-2" type="button">
            <Icon name="hub" className="text-[18px]" />
            <span>Village Clusters &amp; Production (4)</span>
          </button>
          <button className="px-space-md py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all font-label-lg text-label-lg flex items-center gap-2" type="button">
            <Icon name="badge" className="text-[18px]" />
            <span>Member Directory &amp; Landholdings (1,840)</span>
          </button>
          <button className="px-space-md py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all font-label-lg text-label-lg flex items-center gap-2" type="button">
            <Icon name="agriculture" className="text-[18px]" />
            <span>Shared Machinery &amp; Calendar</span>
          </button>
          <button className="px-space-md py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all font-label-lg text-label-lg flex items-center gap-2" type="button">
            <Icon name="local_shipping" className="text-[18px]" />
            <span>Bulk Input Procurement</span>
          </button>
          <button className="px-space-md py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all font-label-lg text-label-lg flex items-center gap-2" type="button">
            <Icon name="payments" className="text-[18px]" />
            <span>Member Off-take Payouts &amp; Dividends</span>
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-lg">
          <div className="lg:col-span-8 flex flex-col gap-space-lg">
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-md gap-space-sm mb-space-md">
                <div className="flex items-center gap-space-sm">
                  <span className="w-9 h-9 rounded-lg bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-semibold">
                    <Icon name="nature_people" className="text-[20px]" />
                  </span>
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface">Village Society Clusters (§4.6)</h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Autonomous member cooperatives federated under the Oke-Ogun Executive Union</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-label-sm text-label-sm px-space-sm py-1 rounded bg-secondary-container text-on-secondary-container font-semibold">Active Sync: 18 Societies</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col justify-between hover:bg-surface-container transition-colors">
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-label-sm text-label-sm font-semibold uppercase text-secondary">Cluster A · Iseyin Zone</span>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Iseyin Savanna Growers Wing</h3>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-surface-container-lowest font-label-sm text-label-sm text-primary font-bold shadow-sm">100% Surveyed</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">420 Registered Members · 890 Hectares (SAMMAZ-52 Maize &amp; Soybeans dual-cropping cycle).</p>
                  </div>
                  <div className="mt-space-md pt-space-sm flex flex-col gap-2">
                    <div className="flex items-center justify-between text-body-sm font-body-sm">
                      <span className="text-on-surface-variant">Shared Tractor Deployment</span>
                      <span className="font-semibold text-secondary">All 3 Units In Field</span>
                    </div>
                    <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                      <div className="bg-secondary h-full rounded-full" style={{ width: "100%" }} />
                    </div>
                    <div className="flex items-center justify-between font-label-sm text-label-sm text-outline pt-1">
                      <span>Cadastral Boundary Pins: 1,680</span>
                      <span className="text-on-surface font-semibold">Zone Lead: J. Adegoke</span>
                    </div>
                  </div>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col justify-between hover:bg-surface-container transition-colors">
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-label-sm text-label-sm font-semibold uppercase text-secondary">Cluster B · Saki Highland</span>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Saki West Outgrower Co-op</h3>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-surface-container-lowest font-label-sm text-label-sm text-tertiary-container font-bold shadow-sm">NAGS-AP Grant</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">510 Members · 1,120 Hectares · Accredited Foundation Seed Multiplier Hub.</p>
                  </div>
                  <div className="mt-space-md pt-space-sm flex flex-col gap-2">
                    <div className="flex items-center justify-between text-body-sm font-body-sm">
                      <span className="text-on-surface-variant">Subsidy Allocation Sweep</span>
                      <span className="font-semibold text-primary">₦34.80M Disbursed</span>
                    </div>
                    <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: "88%" }} />
                    </div>
                    <div className="flex items-center justify-between font-label-sm text-label-sm text-outline pt-1">
                      <span>Certified Seed Purity: 99.4%</span>
                      <span className="text-on-surface font-semibold">Zone Lead: B. Tijani</span>
                    </div>
                  </div>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col justify-between hover:bg-surface-container transition-colors">
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-label-sm text-label-sm font-semibold uppercase text-secondary">Cluster C · Ago-Are Corridor</span>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Ago-Are Cassava Growers Syndicate</h3>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-surface-container-lowest font-label-sm text-label-sm text-secondary font-bold shadow-sm">Industrial Off-take</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">380 Members · 640 Hectares · Contracted direct supply to Psaltry Starch Processing Plant (#AGR-CTR-2026-081).</p>
                  </div>
                  <div className="mt-space-md pt-space-sm flex flex-col gap-2">
                    <div className="flex items-center justify-between text-body-sm font-body-sm">
                      <span className="text-on-surface-variant">Tuber Harvest Target: 9,600 MT</span>
                      <span className="font-semibold text-secondary">74.7% Fulfilled</span>
                    </div>
                    <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                      <div className="bg-secondary-fixed-dim h-full rounded-full" style={{ width: "74.7%" }} />
                    </div>
                    <div className="flex items-center justify-between font-label-sm text-label-sm text-outline pt-1">
                      <span>Starch Content Spec: &gt;21.5%</span>
                      <span className="text-on-surface font-semibold">Zone Lead: M. Alagbe</span>
                    </div>
                  </div>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col justify-between hover:bg-surface-container transition-colors">
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-label-sm text-label-sm font-semibold uppercase text-secondary">Cluster D · Okaka / Otu Valley</span>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Okaka &amp; Otu Grain Alliance</h3>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-surface-container-lowest font-label-sm text-label-sm text-on-surface font-bold shadow-sm">Grand Cereals</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">530 Members · 800 Hectares · 92% Feed-grade maize quota pledged under institutional escrow contract.</p>
                  </div>
                  <div className="mt-space-md pt-space-sm flex flex-col gap-2">
                    <div className="flex items-center justify-between text-body-sm font-body-sm">
                      <span className="text-on-surface-variant">Collective Escrow Deposit</span>
                      <span className="font-semibold text-primary">₦147.0M Released</span>
                    </div>
                    <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: "92%" }} />
                    </div>
                    <div className="flex items-center justify-between font-label-sm text-label-sm text-outline pt-1">
                      <span>Aflatoxin Control: Pass (&lt;10ppb)</span>
                      <span className="text-on-surface font-semibold">Zone Lead: H. Bello</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-md gap-space-sm mb-space-md">
                <div className="flex items-center gap-space-sm">
                  <span className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center font-semibold">
                    <Icon name="commute" className="text-[20px]" />
                  </span>
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface">Shared Machinery Pooling (§10.2 Asset Register)</h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">14 Cooperative-Owned Heavy Implements · Subsidized Member Booking Rates</p>
                  </div>
                </div>
                <button className="h-9 px-space-md rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-label-lg text-label-lg transition-colors flex items-center gap-1.5 self-start" type="button">
                  <Icon name="calendar_month" className="text-[16px]" />
                  <span>Reserve Tractor Slot</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md mb-space-md">
                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
                      <span className="font-label-lg text-label-lg font-semibold text-on-surface">Massey Ferguson 375 #TR-04</span>
                    </div>
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-semibold">In Field Dispatch</span>
                  </div>
                  <div className="grid grid-cols-3 gap-space-xs text-center py-2 bg-surface-container-lowest rounded-lg">
                    <div>
                      <span className="block font-label-sm text-label-sm text-outline">Operation</span>
                      <span className="font-body-md text-body-md font-semibold text-on-surface">Harrowing</span>
                    </div>
                    <div>
                      <span className="block font-label-sm text-label-sm text-outline">Location</span>
                      <span className="font-body-md text-body-md font-semibold text-on-surface">Saki West, Plot 14</span>
                    </div>
                    <div>
                      <span className="block font-label-sm text-label-sm text-outline">Today&apos;s Acreage</span>
                      <span className="font-body-md text-body-md font-semibold text-secondary">18.0 Ha</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant pt-1">
                    <span>Union Certified Operator: <strong className="text-on-surface">Jimoh Rasaq</strong></span>
                    <span>Fuel Remainder: <strong>72% (Diesel)</strong></span>
                  </div>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-tertiary-container" />
                      <span className="font-label-lg text-label-lg font-semibold text-on-surface">Multi-crop Thresher #TH-02</span>
                    </div>
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-semibold">Staged for Transport</span>
                  </div>
                  <div className="grid grid-cols-3 gap-space-xs text-center py-2 bg-surface-container-lowest rounded-lg">
                    <div>
                      <span className="block font-label-sm text-label-sm text-outline">Target Depot</span>
                      <span className="font-body-md text-body-md font-semibold text-on-surface">Iseyin Central</span>
                    </div>
                    <div>
                      <span className="block font-label-sm text-label-sm text-outline">Scheduled</span>
                      <span className="font-body-md text-body-md font-semibold text-on-surface">Tomorrow 07:00</span>
                    </div>
                    <div>
                      <span className="block font-label-sm text-label-sm text-outline">Batch Queue</span>
                      <span className="font-body-md text-body-md font-semibold text-primary">6 Smallholders</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant pt-1">
                    <span>Haulage Escort: <strong className="text-on-surface">Kareem Alade</strong></span>
                    <span>Maintenance Status: <strong>Service Grade A</strong></span>
                  </div>
                </div>
              </div>
              <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-md">
                <div className="flex items-center gap-space-md">
                  <div className="w-12 h-12 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center font-bold font-headline-md text-headline-md">14/14</div>
                  <div className="flex flex-col">
                    <span className="font-label-lg text-label-lg font-semibold text-on-surface">Full Fleet Availability &amp; Maintenance Sync</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Preventive service schedule synchronized via CultivaNode Telematics Engine</span>
                  </div>
                </div>
                <div className="flex items-center gap-space-sm text-body-sm font-body-sm">
                  <span className="px-space-sm py-1 rounded bg-surface-container-lowest font-medium text-on-surface">Hourly Member Tariff: ₦18,500/Ha <span className="text-outline">(Market: ₦28,000)</span></span>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-md gap-space-sm mb-space-md">
                <div className="flex items-center gap-space-sm">
                  <span className="w-9 h-9 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center font-semibold">
                    <Icon name="local_mall" className="text-[20px]" />
                  </span>
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface">Collective Bulk Input Consignments</h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Aggregated direct manufacturer purchases minimizing intermediary markup</p>
                  </div>
                </div>
                <span className="font-label-sm text-label-sm text-outline">Batch Ref: #BLK-2026-04</span>
              </div>
              <div className="p-space-md rounded-lg bg-surface-container-low mb-space-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-space-md">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold">100% DISPATCHED</span>
                    <span className="font-label-lg text-label-lg font-semibold text-on-surface">Consignment #BLK-2026-04 (Early Rains Baseline)</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">1,200 Bags NPK 20-10-10 + 600 Bags Urea · Oyo State Agro-Chemicals Supply Chain</p>
                </div>
                <div className="flex flex-col md:text-right">
                  <span className="font-metric-num text-metric-num text-primary">₦75,600,000</span>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold">Allocated across 420 smallholder farm units</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body-sm text-body-sm">
                  <thead>
                    <tr className="bg-surface-container-low text-outline font-label-sm text-label-sm uppercase tracking-wider">
                      <th className="py-2.5 px-space-md rounded-l-lg">Society / Depot</th>
                      <th className="py-2.5 px-space-md">Quantity (NPK/Urea)</th>
                      <th className="py-2.5 px-space-md">Member Value</th>
                      <th className="py-2.5 px-space-md">Subsidy Deduction</th>
                      <th className="py-2.5 px-space-md rounded-r-lg text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-0">
                    {_props.slots?.orders ?? (
                      <>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 px-space-md font-semibold text-on-surface">Iseyin Central Agrochemical Vault</td>
                      <td className="py-3 px-space-md text-on-surface-variant">600 NPK / 300 Urea</td>
                      <td className="py-3 px-space-md font-medium text-on-surface">₦37,800,000</td>
                      <td className="py-3 px-space-md text-secondary font-semibold">₦11,340,000 (Oyo AgRes)</td>
                      <td className="py-3 px-space-md text-right">
                        <span className="inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm font-semibold"><Icon name="check_circle" className="text-[14px]" /> Disbursed</span>
                      </td>
                    </tr>
                    <tr className="bg-surface-container-lowest hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 px-space-md font-semibold text-on-surface">Saki West Distribution Point</td>
                      <td className="py-3 px-space-md text-on-surface-variant">400 NPK / 200 Urea</td>
                      <td className="py-3 px-space-md font-medium text-on-surface">₦25,200,000</td>
                      <td className="py-3 px-space-md text-secondary font-semibold">₦7,560,000 (NAGS-AP)</td>
                      <td className="py-3 px-space-md text-right">
                        <span className="inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm font-semibold"><Icon name="check_circle" className="text-[14px]" /> Disbursed</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 px-space-md font-semibold text-on-surface">Ago-Are Primary Society Shed</td>
                      <td className="py-3 px-space-md text-on-surface-variant">200 NPK / 100 Urea</td>
                      <td className="py-3 px-space-md font-medium text-on-surface">₦12,600,000</td>
                      <td className="py-3 px-space-md text-secondary font-semibold">₦3,780,000 (Co-op Credit)</td>
                      <td className="py-3 px-space-md text-right">
                        <span className="inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm font-semibold"><Icon name="check_circle" className="text-[14px]" /> Disbursed</span>
                      </td>
                    </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-space-lg">
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
              <div className="flex items-center justify-between pb-space-md mb-space-md">
                <div className="flex items-center gap-space-xs">
                  <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="handshake" className="text-[18px]" />
                  </span>
                  <h2 className="font-headline-md text-headline-md text-on-surface">Off-take Quotas (§6.4)</h2>
                </div>
                <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-semibold">Institutional Escrow</span>
              </div>
              <div className="flex flex-col gap-space-md">
                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-label-lg text-label-lg font-semibold text-on-surface">Grand Cereals Limited</span>
                    <span className="font-label-sm text-label-sm text-outline">#AGR-CTR-2026-094</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">White Maize (Feed Grade)</span>
                    <span className="font-label-md text-label-md font-bold text-secondary">850 / 1,200 MT (70.8%)</span>
                  </div>
                  <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden mt-1">
                    <div className="bg-secondary h-full rounded-full" style={{ width: "70.8%" }} />
                  </div>
                  <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant pt-2">
                    <span>Released Escrow: <strong className="text-on-surface font-semibold">₦147.0M</strong></span>
                    <span className="text-secondary font-semibold">Direct Apex Sweep</span>
                  </div>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-label-lg text-label-lg font-semibold text-on-surface">Psaltry International</span>
                    <span className="font-label-sm text-label-sm text-outline">#AGR-CTR-2026-081</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Industrial Wet Cassava</span>
                    <span className="font-label-md text-label-md font-bold text-primary">1,120 / 1,500 MT (74.7%)</span>
                  </div>
                  <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden mt-1">
                    <div className="bg-primary h-full rounded-full" style={{ width: "74.7%" }} />
                  </div>
                  <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant pt-2">
                    <span>Released Escrow: <strong className="text-on-surface font-semibold">₦128.8M</strong></span>
                    <span className="text-primary font-semibold">Factory Weighbridge Verified</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
              <div className="flex items-center justify-between pb-space-md mb-space-md">
                <div className="flex items-center gap-space-xs">
                  <span className="w-8 h-8 rounded-lg bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-semibold">
                    <Icon name="receipt_long" className="text-[18px]" />
                  </span>
                  <h2 className="font-headline-md text-headline-md text-on-surface">Member Delivery Queue</h2>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" title="Live Weighbridge Stream" />
              </div>
              <div className="flex flex-col gap-space-md">
                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-label-lg text-label-lg font-bold text-on-surface">Rasheed Gbadamosi</h3>
                      <span className="font-body-sm text-body-sm text-outline">ID: #OOG-4091 · Saki West</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-surface-container-lowest font-label-sm text-label-sm text-secondary font-semibold">8.4 MT Maize</span>
                  </div>
                  <div className="flex flex-col gap-1 text-body-sm font-body-sm pt-1">
                    <div className="flex justify-between text-on-surface-variant">
                      <span>Gross Value</span>
                      <span className="font-medium text-on-surface">₦3,528,000</span>
                    </div>
                    <div className="flex justify-between text-error font-medium">
                      <span>Less: Bulk Fertilizer Offset</span>
                      <span>-₦450,000</span>
                    </div>
                    <div className="flex justify-between text-on-surface font-bold pt-1">
                      <span>Net Disbursed</span>
                      <span className="text-secondary text-base">₦3,078,000</span>
                    </div>
                  </div>
                  <div className="mt-1 pt-2 flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant bg-surface-container-lowest px-2 py-1.5 rounded">
                    <span className="flex items-center gap-1"><Icon name="bolt" className="text-[14px] text-secondary" /> Zenith NIBSS Instant</span>
                    <span className="text-outline">Tx: #WT-99201</span>
                  </div>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-label-lg text-label-lg font-bold text-on-surface">Folake Alabi</h3>
                      <span className="font-body-sm text-body-sm text-outline">ID: #OOG-3182 · Ago-Are</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-surface-container-lowest font-label-sm text-label-sm text-primary font-semibold">14.2 MT Cassava</span>
                  </div>
                  <div className="flex flex-col gap-1 text-body-sm font-body-sm pt-1">
                    <div className="flex justify-between text-on-surface-variant">
                      <span>Gross Value</span>
                      <span className="font-medium text-on-surface">₦1,704,000</span>
                    </div>
                    <div className="flex justify-between text-error font-medium">
                      <span>Less: Machinery Levy</span>
                      <span>-₦71,000</span>
                    </div>
                    <div className="flex justify-between text-on-surface font-bold pt-1">
                      <span>Net Disbursed</span>
                      <span className="text-primary text-base">₦1,633,000</span>
                    </div>
                  </div>
                  <div className="mt-1 pt-2 flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant bg-surface-container-lowest px-2 py-1.5 rounded">
                    <span className="flex items-center gap-1"><Icon name="bolt" className="text-[14px] text-secondary" /> Access Bank Auto-Disburse</span>
                    <span className="text-outline">Tx: #WT-99202</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
              <div className="flex items-center justify-between pb-space-md mb-space-md">
                <div className="flex items-center gap-space-xs">
                  <span className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center font-semibold">
                    <Icon name="how_to_vote" className="text-[18px]" />
                  </span>
                  <h2 className="font-headline-md text-headline-md text-on-surface">Union Governance (§14)</h2>
                </div>
                <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-semibold">AGM Scheduled</span>
              </div>
              <div className="p-space-md rounded-lg bg-surface-container-low mb-space-md flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-label-sm font-label-sm text-primary font-bold uppercase">
                  <Icon name="event" className="text-[16px]" />
                  <span>Annual General Assembly (AGM)</span>
                </div>
                <div className="font-headline-sm text-headline-sm font-semibold text-on-surface">April 14, 2026 · 10:00 AM</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">Saki Town Hall &amp; Virtual Delegation Hub</div>
                <p className="font-body-sm text-body-sm text-outline mt-1">Agenda: Audited 2025/2026 Financial Statements, Dividend Declaration &amp; Equipment Syndication Expansion.</p>
              </div>
              <div className="flex flex-col gap-space-sm">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Pending Committee Actions (5)</span>
                <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between gap-space-sm">
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-semibold text-on-surface">Tractor Fleet Overhaul (3 Units)</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">₦1,800,000 · Machinery Sub-committee</span>
                  </div>
                  <button className="px-space-sm py-1 rounded bg-primary text-on-primary font-label-sm text-label-sm hover:bg-primary-container transition-colors shadow-sm" type="button">Sign</button>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between gap-space-sm">
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-semibold text-on-surface">Member Welfare Credit Guarantees</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">2 Applications · Zenith Bank Window</span>
                  </div>
                  <button className="px-space-sm py-1 rounded bg-secondary text-on-secondary font-label-sm text-label-sm hover:bg-secondary-container hover:text-on-secondary-container transition-colors shadow-sm" type="button">Review</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm flex flex-col md:flex-row items-center justify-between gap-space-md">
          <div className="flex flex-wrap items-center gap-y-1 gap-x-space-lg text-body-sm font-body-sm text-on-surface-variant">
            <div className="flex items-center gap-1.5">
              <Icon name="gavel" className="text-[18px] text-secondary" />
              <span>Oyo State Cooperative Societies Law Cap 35 Compliant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Icon name="corporate_fare" className="text-[18px] text-secondary" />
              <span>CAMA 2020 Part F Registered Entity</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Icon name="fingerprint" className="text-[18px] text-secondary" />
              <span>NDPA 2023 Member Consent &amp; Biometrics Validated</span>
            </div>
          </div>
          <div className="flex items-center gap-space-sm text-label-sm font-label-sm">
            <span className="px-space-sm py-1 rounded bg-surface-container font-semibold text-primary">Bank Escrow Reconciliation: 100% BALANCED</span>
            <span className="text-outline">CultivaNode Core Cooperative Subsystem §10.2</span>
          </div>
        </div>
      </div>
    </div>
  );
}
