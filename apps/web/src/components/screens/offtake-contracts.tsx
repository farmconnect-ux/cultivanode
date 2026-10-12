"use client";

// Ported from the "agricultural_contracts_off_take_agreements_6.7" design. Interactive client workspace
// with live settlement console, milestone release authorization, e-waybill generation, and quality certificates.
import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import { downloadFile } from "@/lib/download";
import { showScreenToast } from "@/components/ds/screen-dialog";
import type { ScreenProps } from "./types";

export function OfftakeContracts(_props: ScreenProps) {
  const lang = _props?.lang ?? "en";
  const [authorizedPayout, setAuthorizedPayout] = useState(false);
  const [activeModal, setActiveModal] = useState<"settlement" | "waybills" | "quality" | null>(null);
  const [activePage, setActivePage] = useState(1);

  const handleAuthorizeMilestone = () => {
    setAuthorizedPayout(true);
    showScreenToast("Milestone 3 Payout Authorized: ₦42,510,000.00 released via Zenith Escrow NIBSS");
  };

  const handleGenerateWaybill = () => {
    const csv = [
      "Waybill_ID,Contract_ID,Consignment,Gross_Weight_KG,Tare_KG,Net_MT,Destination,Carrier,Status",
      "WB-2026-9921,AGR-CTR-2026-081,Industrial Cassava (TME-419),42850,14350,28.50,Psaltry Starch Plant,Bedford Tipper OYO-442-XA,Certified & Delivered",
      "WB-2026-9922,AGR-CTR-2026-081,Industrial Cassava (TME-419),41200,14200,27.00,Psaltry Starch Plant,Mack Truck OG-112-AB,Intake Verified",
      "",
      "Total_Consignment_MT,Quality_Assay_Ref,Release_Authorization,Escrow_NIBSS",
      "55.50 MT,QC-NG-2026-8819,EXECUTED,Zenith Bank PLC Instant",
    ].join("\n");

    downloadFile(`ewaybill-psaltry-M3-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    showScreenToast("e-Waybill & Receipt (.csv) generated successfully");
  };
  return (
    <div className="screen">
      <div className="flex items-center gap-space-xs text-body-sm font-body-sm text-on-surface-variant mb-space-md">
        <span className="hover:text-primary cursor-pointer transition-colors">Agricultural Commerce</span>
        <Icon name="chevron_right" className="text-[16px] text-outline" />
        <span className="text-on-surface font-semibold">Agricultural Contracts &amp; Structured Off-take Agreements (§6.7)</span>
      </div>
      <div className="flex flex-col w-full gap-space-lg">
        <div className="flex flex-col gap-space-sm bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-space-md">
            <div className="flex flex-col max-w-3xl">
              <div className="flex items-center gap-space-sm mb-1">
                <span className="inline-flex items-center px-space-xs py-0.5 rounded text-label-sm font-label-sm bg-primary-container text-on-primary-container">MASTER REGISTRY §6.7</span>
                <span className="text-body-sm font-body-sm text-outline">·</span>
                <span className="text-body-sm font-body-sm text-on-surface-variant font-medium">South-West Industrial Agro-Corridor</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight">Agricultural Contracts &amp; Off-take Agreement Hub</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">Legally binding structured supply contracts, outgrower production covenants, delivery milestones, automated quality grading underwriting, and milestone-linked escrow disbursements across Oyo, Osun, Ogun, and Ondo agricultural hubs.</p>
            </div>
            <div className="flex flex-wrap items-center gap-space-sm">
              {_props.slots?.actions ?? (
                <>
                  <a className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high transition-colors shadow-sm" href="/api/documents/legal-pack">
                    <Icon name="gavel" className="text-[18px]" />
                    <span>Legal Templates</span>
                  </a>
                  <a className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high transition-colors shadow-sm" href="/api/documents/contracts-registry">
                    <Icon name="download" className="text-[18px]" />
                    <span>Export Registry</span>
                  </a>
                  <Link className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container transition-colors shadow-md" href={`/${lang}/contact?subject=draft-master-contract`}>
                    <Icon name="add_circle" className="text-[18px]" />
                    <span>Draft Master Contract</span>
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-space-sm pt-space-md mt-space-sm bg-surface-container-low px-space-md py-space-sm rounded-lg">
            <div className="flex items-center gap-1.5 text-on-surface">
              <Icon name="verified_user" className="text-[16px] text-secondary" />
              <span className="font-label-sm text-label-sm font-semibold">Legally Enforceable (CAMA 2020 &amp; Arb. Rules §11.3)</span>
            </div>
            <span className="text-outline-variant">|</span>
            <div className="flex items-center gap-1.5 text-on-surface">
              <Icon name="account_balance" className="text-[16px] text-primary" />
              <span className="font-label-sm text-label-sm font-semibold">Zenith Bank Tripartite Escrow Custody</span>
            </div>
            <span className="text-outline-variant">|</span>
            <div className="flex items-center gap-1.5 text-on-surface">
              <Icon name="biotech" className="text-[16px] text-tertiary-container" />
              <span className="font-label-sm text-label-sm font-semibold">SON / NAFDAC Quality Standards Bound</span>
            </div>
            <span className="text-outline-variant">|</span>
            <div className="flex items-center gap-1.5 text-on-surface">
              <Icon name="enhanced_encryption" className="text-[16px] text-secondary" />
              <span className="font-label-sm text-label-sm font-semibold">Multi-Party SHA-256 Signatures Intact</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-space-md">
          <div className="flex flex-col bg-surface-container-lowest p-space-md rounded-xl shadow-sm justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-md text-label-md uppercase tracking-wider">Active Contracts</span>
              <Icon name="handshake" className="text-secondary text-[20px]" />
            </div>
            <div className="mt-space-sm">
              <div className="font-metric-num text-metric-num text-on-surface">24 Active</div>
              <div className="font-label-md text-label-md text-on-surface font-semibold mt-0.5">₦642.5M Total Portfolio</div>
            </div>
            <div className="flex items-center gap-1 mt-space-sm text-secondary">
              <Icon name="trending_up" className="text-[16px]" />
              <span className="font-label-sm text-label-sm font-semibold">+18.2% YoY Off-take Value</span>
            </div>
          </div>
          <div className="flex flex-col bg-surface-container-lowest p-space-md rounded-xl shadow-sm justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-md text-label-md uppercase tracking-wider">Committed Volume</span>
              <Icon name="scale" className="text-primary text-[20px]" />
            </div>
            <div className="mt-space-sm">
              <div className="font-metric-num text-metric-num text-on-surface">4,850 MT</div>
              <div className="font-label-md text-label-md text-on-surface-variant mt-0.5">3,410 MT Delivered (70.3%)</div>
            </div>
            <div className="mt-space-sm">
              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: "70.3%" }} />
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-1 inline-block">1,440 MT Balance Remainder</span>
            </div>
          </div>
          <div className="flex flex-col bg-surface-container-lowest p-space-md rounded-xl shadow-sm justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-md text-label-md uppercase tracking-wider">Locked Escrow</span>
              <Icon name="lock_clock" className="text-secondary text-[20px]" />
            </div>
            <div className="mt-space-sm">
              <div className="font-metric-num text-metric-num text-on-surface">₦318.4M</div>
              <div className="font-label-md text-label-md text-secondary font-semibold mt-0.5">Zenith Tripartite Custody</div>
            </div>
            <div className="flex items-center gap-1 mt-space-sm text-on-surface-variant">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              <span className="font-label-sm text-label-sm">₦182.6M Disbursed MTD</span>
            </div>
          </div>
          <div className="flex flex-col bg-surface-container-lowest p-space-md rounded-xl shadow-sm justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-md text-label-md uppercase tracking-wider">On-Time Fulfilment</span>
              <Icon name="schedule" className="text-secondary text-[20px]" />
            </div>
            <div className="mt-space-sm">
              <div className="font-metric-num text-metric-num text-on-surface">96.4%</div>
              <div className="font-label-md text-label-md text-on-surface-variant mt-0.5">+2.1% vs Regional Baseline</div>
            </div>
            <div className="flex items-center gap-1 mt-space-sm text-secondary font-semibold">
              <Icon name="check_circle" className="text-[16px]" />
              <span className="font-label-sm text-label-sm">0 Uncured Default Notices</span>
            </div>
          </div>
          <div className="flex flex-col bg-surface-container-lowest p-space-md rounded-xl shadow-sm justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-md text-label-md uppercase tracking-wider">Quality Adherence</span>
              <Icon name="verified" className="text-tertiary-container text-[20px]" />
            </div>
            <div className="mt-space-sm">
              <div className="font-metric-num text-metric-num text-on-surface">98.1%</div>
              <div className="font-label-md text-label-md text-on-surface-variant mt-0.5">Grade A/B Accepted</div>
            </div>
            <div className="flex items-center justify-between mt-space-sm text-outline font-label-sm text-label-sm">
              <span>Moisture ≤13.0%</span>
              <span className="text-on-tertiary-fixed-variant">1.9% Deductions</span>
            </div>
          </div>
          <div className="flex flex-col bg-surface-container-lowest p-space-md rounded-xl shadow-sm justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-md text-label-md uppercase tracking-wider">Outgrower Coverage</span>
              <Icon name="groups" className="text-primary text-[20px]" />
            </div>
            <div className="mt-space-sm">
              <div className="font-metric-num text-metric-num text-on-surface">1,140</div>
              <div className="font-label-md text-label-md text-on-surface-variant mt-0.5">Across 18 Cooperatives</div>
            </div>
            <div className="flex items-center gap-1 mt-space-sm text-on-surface font-semibold">
              <Icon name="badge" className="text-[16px] text-secondary" />
              <span className="font-label-sm text-label-sm">100% NIN &amp; GPS Linked</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-space-md">
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs">
                <span className="font-headline-lg text-headline-lg text-primary">Active Off-take Agreements &amp; Milestone Radar</span>
                <span className="px-space-xs py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm">4 In High Delivery Phase</span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant">Real-time tracking of bilateral covenants, volumetric weighbridge intake, and multi-party milestone escrow triggers.</p>
            </div>
            <div className="flex items-center gap-space-sm">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Fulfillment Velocity:</span>
              <span className="inline-flex items-center px-space-sm py-1 rounded bg-surface-container-low text-primary font-label-md text-label-md font-semibold">High (840 MT / Week Ingress)</span>
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-space-lg mt-space-sm">
            <div className="flex flex-col bg-surface-container-low rounded-xl p-space-lg shadow-sm justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-space-sm mb-space-sm">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-headline-md text-headline-md text-primary">#AGR-CTR-2026-081</span>
                    <span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded text-label-sm font-label-sm bg-secondary-fixed text-on-secondary-fixed font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Active Milestone 3</span>
                  </div>
                  <div className="text-right">
                    <span className="font-headline-md text-headline-md text-primary font-bold">₦172,500,000</span>
                    <span className="block font-label-sm text-label-sm text-on-surface-variant">₦115,000 / MT Fixed Floor + Quality Bonus</span>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-space-md rounded-lg mb-space-md">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm text-body-sm font-body-sm">
                    <div>
                      <span className="text-outline uppercase text-label-sm font-label-sm block">Corporate Buyer / Off-taker</span>
                      <span className="font-semibold text-on-surface text-body-md font-body-md">Psaltry International PLC</span>
                      <span className="text-outline block text-label-sm font-label-sm">Factory Gate Weighbridge #2, Ado-Awaye</span>
                    </div>
                    <div>
                      <span className="text-outline uppercase text-label-sm font-label-sm block">Producer Syndicate</span>
                      <span className="font-semibold text-on-surface text-body-md font-body-md">Ado-Awaye Outgrowers Union</span>
                      <span className="text-outline block text-label-sm font-label-sm">480 Smallholders · Oyo Savanna Block</span>
                    </div>
                  </div>
                  <div className="mt-space-sm pt-space-xs flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
                    <span><strong>Commodity:</strong> Industrial Fresh Cassava (TME 419 - Starch Grade)</span>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">NIR Starch ≥ 24.0% Required</span>
                  </div>
                </div>
                <div className="mb-space-md">
                  <div className="flex items-center justify-between text-label-md font-label-md mb-1">
                    <span className="text-on-surface font-semibold">1,120 MT Delivered of 1,500 MT Committed</span>
                    <span className="text-primary font-bold">74.7% Complete</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                    <div className="bg-secondary h-full rounded-full" style={{ width: "74.7%" }} />
                  </div>
                  <div className="flex justify-between text-label-sm font-label-sm text-outline mt-1">
                    <span>Window: 15 Apr – 30 Jun 2026</span>
                    <span className="text-on-surface font-medium">380 MT Outstanding Final Batch</span>
                  </div>
                </div>
                <div className="space-y-space-xs mb-space-md">
                  <div className="flex items-center justify-between p-space-xs px-space-sm rounded bg-surface-container-lowest text-body-sm font-body-sm">
                    <div className="flex items-center gap-space-xs">
                      <Icon name="check_circle" className="text-secondary text-[18px]" />
                      <span className="font-medium text-on-surface">M1: 500 MT Intake &amp; Starch Lab Assay</span>
                    </div>
                    <div className="flex items-center gap-space-sm">
                      <span className="text-secondary font-semibold font-label-sm text-label-sm">₦57,500,000 Disbursed</span>
                      <span className="text-outline text-label-sm font-label-sm">28 Apr</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-space-xs px-space-sm rounded bg-surface-container-lowest text-body-sm font-body-sm">
                    <div className="flex items-center gap-space-xs">
                      <Icon name="check_circle" className="text-secondary text-[18px]" />
                      <span className="font-medium text-on-surface">M2: 620 MT Intake Batch</span>
                    </div>
                    <div className="flex items-center gap-space-sm">
                      <span className="text-secondary font-semibold font-label-sm text-label-sm">₦71,300,000 Disbursed</span>
                      <span className="text-outline text-label-sm font-label-sm">18 May</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-space-xs px-space-sm rounded bg-surface-container-high text-body-sm font-body-sm">
                    <div className="flex items-center gap-space-xs">
                      <Icon name="pending" className="text-primary text-[18px]" />
                      <span className="font-semibold text-primary">M3: 380 MT Final Consignment (Active Inspection)</span>
                    </div>
                    <div className="flex items-center gap-space-sm">
                      <span className="text-primary font-bold font-label-sm text-label-sm">₦43,700,000 In Zenith Escrow</span>
                      <span className="text-error font-semibold text-label-sm font-label-sm">4 Days Rem.</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between pt-space-sm mt-space-xs text-label-sm font-label-sm text-on-surface-variant">
                <div className="flex items-center gap-space-xs">
                  <Icon name="fingerprint" className="text-[16px] text-secondary" />
                  <span>Signed: Dr. Y. Olusola (CEO, Psaltry) &amp; Chief A. Tijani (Union)</span>
                </div>
                <button
                  onClick={() => setActiveModal("settlement")}
                  className="text-primary font-semibold hover:underline inline-flex items-center gap-0.5"
                  type="button"
                >
                  View Live Settlement Console →
                </button>
              </div>
            </div>
            <div className="flex flex-col bg-surface-container-low rounded-xl p-space-lg shadow-sm justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-space-sm mb-space-sm">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-headline-md text-headline-md text-primary">#AGR-CTR-2026-094</span>
                    <span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded text-label-sm font-label-sm bg-secondary-fixed text-on-secondary-fixed font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> On-Track · High Velocity</span>
                  </div>
                  <div className="text-right">
                    <span className="font-headline-md text-headline-md text-primary font-bold">₦504,000,000</span>
                    <span className="block font-label-sm text-label-sm text-on-surface-variant">₦420,000 / MT Commercial Grade</span>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-space-md rounded-lg mb-space-md">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm text-body-sm font-body-sm">
                    <div>
                      <span className="text-outline uppercase text-label-sm font-label-sm block">Corporate Buyer / Off-taker</span>
                      <span className="font-semibold text-on-surface text-body-md font-body-md">Grand Cereals Ltd (UAC Sub)</span>
                      <span className="text-outline block text-label-sm font-label-sm">Grain Terminal Hub, Oluyole, Ibadan</span>
                    </div>
                    <div>
                      <span className="text-outline uppercase text-label-sm font-label-sm block">Producer Syndicate</span>
                      <span className="font-semibold text-on-surface text-body-md font-body-md">Iseyin Savanna Growers Co-op</span>
                      <span className="text-outline block text-label-sm font-label-sm">310 Smallholders · Saki &amp; Iseyin Tracts</span>
                    </div>
                  </div>
                  <div className="mt-space-sm pt-space-xs flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
                    <span><strong>Commodity:</strong> Yellow Feed Maize (SAMMAZ-52)</span>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">Moisture ≤ 13.0% Guaranteed</span>
                  </div>
                </div>
                <div className="mb-space-md">
                  <div className="flex items-center justify-between text-label-md font-label-md mb-1">
                    <span className="text-on-surface font-semibold">850 MT Delivered of 1,200 MT Committed</span>
                    <span className="text-primary font-bold">70.8% Complete</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                    <div className="bg-secondary h-full rounded-full" style={{ width: "70.8%" }} />
                  </div>
                  <div className="flex justify-between text-label-sm font-label-sm text-outline mt-1">
                    <span>Window: 01 May – 15 Jul 2026</span>
                    <span className="text-on-surface font-medium">350 MT in Aggregation at Saki Silos</span>
                  </div>
                </div>
                <div className="space-y-space-xs mb-space-md">
                  <div className="flex items-center justify-between p-space-xs px-space-sm rounded bg-surface-container-lowest text-body-sm font-body-sm">
                    <div className="flex items-center gap-space-xs">
                      <Icon name="check_circle" className="text-secondary text-[18px]" />
                      <span className="font-medium text-on-surface">M1: 400 MT Intake Silo Drop</span>
                    </div>
                    <div className="flex items-center gap-space-sm">
                      <span className="text-secondary font-semibold font-label-sm text-label-sm">₦168,000,000 Settled</span>
                      <span className="text-outline text-label-sm font-label-sm">12 May</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-space-xs px-space-sm rounded bg-surface-container-lowest text-body-sm font-body-sm">
                    <div className="flex items-center gap-space-xs">
                      <Icon name="check_circle" className="text-secondary text-[18px]" />
                      <span className="font-medium text-on-surface">M2: 450 MT Intake Weighbridge Cleared</span>
                    </div>
                    <div className="flex items-center gap-space-sm">
                      <span className="text-secondary font-semibold font-label-sm text-label-sm">₦189,000,000 Settled</span>
                      <span className="text-outline text-label-sm font-label-sm">29 May</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-space-xs px-space-sm rounded bg-surface-container-lowest text-body-sm font-body-sm">
                    <div className="flex items-center gap-space-xs">
                      <Icon name="inventory_2" className="text-outline text-[18px]" />
                      <span className="font-medium text-on-surface">M3: 350 MT Balance (Moisture Testing in Progress)</span>
                    </div>
                    <div className="flex items-center gap-space-sm">
                      <span className="text-on-surface-variant font-semibold font-label-sm text-label-sm">₦147,000,000 Escrow Held</span>
                      <span className="text-outline text-label-sm font-label-sm">Due 22 Jun</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between pt-space-sm mt-space-xs text-label-sm font-label-sm text-on-surface-variant">
                <div className="flex items-center gap-space-xs">
                  <Icon name="security" className="text-[16px] text-secondary" />
                  <span>Zenith Escrow Vault #ZE-094-AGR Verified</span>
                </div>
                <button
                  onClick={() => setActiveModal("waybills")}
                  className="text-primary font-semibold hover:underline inline-flex items-center gap-0.5"
                  type="button"
                >
                  Dossier &amp; Transit Waybills →
                </button>
              </div>
            </div>
            <div className="flex flex-col bg-surface-container-low rounded-xl p-space-lg shadow-sm justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-space-sm mb-space-sm">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-headline-md text-headline-md text-primary">#AGR-CTR-2026-105</span>
                    <span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded text-label-sm font-label-sm bg-secondary-fixed text-on-secondary-fixed font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Quality Premium +2.5% Approved</span>
                  </div>
                  <div className="text-right">
                    <span className="font-headline-md text-headline-md text-primary font-bold">₦544,000,000</span>
                    <span className="block font-label-sm text-label-sm text-on-surface-variant">₦680,000 / MT Non-GMO Soya</span>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-space-md rounded-lg mb-space-md">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm text-body-sm font-body-sm">
                    <div>
                      <span className="text-outline uppercase text-label-sm font-label-sm block">Corporate Buyer / Off-taker</span>
                      <span className="font-semibold text-on-surface text-body-md font-body-md">Premium Edible Oils Ltd</span>
                      <span className="text-outline block text-label-sm font-label-sm">Industrial Extraction Complex, Ede, Osun</span>
                    </div>
                    <div>
                      <span className="text-outline uppercase text-label-sm font-label-sm block">Producer Syndicate</span>
                      <span className="font-semibold text-on-surface text-body-md font-body-md">Oke-Ogun Soya Alliance</span>
                      <span className="text-outline block text-label-sm font-label-sm">220 Commercial Growers · Saki West</span>
                    </div>
                  </div>
                  <div className="mt-space-sm pt-space-xs flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
                    <span><strong>Commodity:</strong> Non-GMO Industrial Soybeans (TGX-1448E)</span>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">Oil Content ≥ 19.0% Assayed</span>
                  </div>
                </div>
                <div className="mb-space-md">
                  <div className="flex items-center justify-between text-label-md font-label-md mb-1">
                    <span className="text-on-surface font-semibold">610 MT Delivered of 800 MT Committed</span>
                    <span className="text-primary font-bold">76.3% Complete</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                    <div className="bg-secondary h-full rounded-full" style={{ width: "76.3%" }} />
                  </div>
                  <div className="flex justify-between text-label-sm font-label-sm text-outline mt-1">
                    <span>Window: 20 Apr – 10 Jul 2026</span>
                    <span className="text-on-surface font-medium">190 MT Final Intake Due 10 Jun</span>
                  </div>
                </div>
                <div className="p-space-sm rounded bg-surface-container-lowest flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="account_balance_wallet" className="text-secondary text-[20px]" />
                    <div>
                      <span className="font-label-md text-label-md font-semibold text-on-surface block">₦129,200,000 Locked in Escrow</span>
                      <span className="text-outline font-label-sm text-label-sm">₦414,800,000 Disbursed to Outgrower Escrow</span>
                    </div>
                  </div>
                  <span className="px-space-xs py-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">Oil Index: 19.8%</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between pt-space-sm mt-space-sm text-label-sm font-label-sm text-on-surface-variant">
                <span>Tripartite Guarantor: NIRSAL Agribusiness Credit Guarantee</span>
                <button
                  onClick={() => setActiveModal("quality")}
                  className="text-primary font-semibold hover:underline inline-flex items-center gap-0.5"
                  type="button"
                >
                  Audit Quality Certificates →
                </button>
              </div>
            </div>
            <div className="flex flex-col bg-surface-container-low rounded-xl p-space-lg shadow-sm justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-space-sm mb-space-sm">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-headline-md text-headline-md text-primary">#AGR-CTR-2026-112</span>
                    <span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded text-label-sm font-label-sm bg-surface-container-high text-primary font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> Active Intake · Sampling Stage</span>
                  </div>
                  <div className="text-right">
                    <span className="font-headline-md text-headline-md text-primary font-bold">₦270,000,000</span>
                    <span className="block font-label-sm text-label-sm text-on-surface-variant">₦540,000 / MT Paddy Floor</span>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-space-md rounded-lg mb-space-md">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm text-body-sm font-body-sm">
                    <div>
                      <span className="text-outline uppercase text-label-sm font-label-sm block">Corporate Buyer / Off-taker</span>
                      <span className="font-semibold text-on-surface text-body-md font-body-md">Olam Agri (Rice Division)</span>
                      <span className="text-outline block text-label-sm font-label-sm">Integrated Milling Complex, Sagamu Interchange</span>
                    </div>
                    <div>
                      <span className="text-outline uppercase text-label-sm font-label-sm block">Producer Syndicate</span>
                      <span className="font-semibold text-on-surface text-body-md font-body-md">Egba Rice Farmers Association</span>
                      <span className="text-outline block text-label-sm font-label-sm">130 River Basin Farmers · Ogun Central</span>
                    </div>
                  </div>
                  <div className="mt-space-sm pt-space-xs flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
                    <span><strong>Commodity:</strong> Long-Grain Paddy Rice (Faro 44)</span>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">Milling Yield ≥ 68.0% Bound</span>
                  </div>
                </div>
                <div className="mb-space-md">
                  <div className="flex items-center justify-between text-label-md font-label-md mb-1">
                    <span className="text-on-surface font-semibold">310 MT Delivered of 500 MT Committed</span>
                    <span className="text-primary font-bold">62.0% Complete</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                    <div className="bg-secondary h-full rounded-full" style={{ width: "62.0%" }} />
                  </div>
                  <div className="flex justify-between text-label-sm font-label-sm text-outline mt-1">
                    <span>Window: 10 May – 30 Jul 2026</span>
                    <span className="text-on-surface font-medium">190 MT Staged at Abeokuta Depot</span>
                  </div>
                </div>
                <div className="p-space-sm rounded bg-surface-container-lowest flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="account_balance_wallet" className="text-secondary text-[20px]" />
                    <div>
                      <span className="font-label-md text-label-md font-semibold text-on-surface block">₦102,600,000 Locked in Escrow</span>
                      <span className="text-outline font-label-sm text-label-sm">₦167,400,000 Disbursed (M1 Cleared)</span>
                    </div>
                  </div>
                  <span className="px-space-xs py-1 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">Moisture: 12.8%</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between pt-space-sm mt-space-sm text-label-sm font-label-sm text-on-surface-variant">
                <span>Escrow Underwriter: Leadway Assurance Agricultural Bond</span>
                <button
                  className="text-primary font-semibold hover:underline inline-flex items-center gap-0.5"
                  type="button"
                  onClick={() => showScreenToast("Intake Queue: 190 MT staged at Abeokuta depot. Moisture verified at 12.8% by Leadway Assurance bond inspector.")}
                >
                  Inspect Intake Queue →
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
          <div className="flex flex-wrap items-center justify-between gap-space-md mb-space-md">
            <div className="flex flex-col">
              <h2 className="font-headline-lg text-headline-lg text-primary">Master Agreement Registry &amp; Covenants</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Complete roster of institutional off-take covenants, arbitration conditions, and active delivery pipelines.</p>
            </div>
            <div className="flex flex-wrap items-center gap-space-sm">
              <div className="flex items-center bg-surface-container-low px-space-md py-1.5 rounded-lg text-on-surface">
                <Icon name="filter_list" className="text-[18px] mr-1 text-outline" />
                <select className="bg-transparent font-label-sm text-label-sm text-on-surface focus:outline-none cursor-pointer">
                  <option>All Commodities</option>
                  <option>Cassava (Industrial)</option>
                  <option>Maize (Feed/Food)</option>
                  <option>Soybean (Non-GMO)</option>
                  <option>Paddy Rice</option>
                </select>
              </div>
              <div className="flex items-center bg-surface-container-low px-space-md py-1.5 rounded-lg text-on-surface">
                <Icon name="tune" className="text-[18px] mr-1 text-outline" />
                <select className="bg-transparent font-label-sm text-label-sm text-on-surface focus:outline-none cursor-pointer">
                  <option>Status: All Active &amp; Staged</option>
                  <option>Active Delivery</option>
                  <option>Escrow Ready</option>
                  <option>Completed / Settled</option>
                </select>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low text-outline font-label-sm text-label-sm uppercase tracking-wider">
                  <th className="py-space-sm px-space-md rounded-l-lg">Contract ID &amp; Ref</th>
                  <th className="py-space-sm px-space-md">Buyer / Off-taker</th>
                  <th className="py-space-sm px-space-md">Producer Union / Co-op</th>
                  <th className="py-space-sm px-space-md">Commodity &amp; Spec</th>
                  <th className="py-space-sm px-space-md">Committed / Delivered</th>
                  <th className="py-space-sm px-space-md">Pricing Formula</th>
                  <th className="py-space-sm px-space-md">Escrow Custody</th>
                  <th className="py-space-sm px-space-md">SLA Status</th>
                  <th className="py-space-sm px-space-md text-right rounded-r-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm divide-y-0">
                {_props.slots?.contracts ?? (
                  <>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="py-space-md px-space-md font-semibold text-primary">
                    <div>#AGR-CTR-2026-081</div>
                    <span className="text-label-sm font-label-sm text-outline">SHA256: 0x4f92..881</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="font-semibold text-on-surface block">Psaltry Int&apos;l PLC</span>
                    <span className="text-label-sm font-label-sm text-outline">Ado-Awaye Factory</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="text-on-surface block">Ado-Awaye Outgrowers</span>
                    <span className="text-label-sm font-label-sm text-outline">480 Growers</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="font-medium text-on-surface block">Cassava (TME 419)</span>
                    <span className="text-label-sm font-label-sm text-secondary font-semibold">Starch ≥ 24.0%</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="font-semibold text-on-surface">1,120 / 1,500 MT</span>
                    <div className="w-24 bg-surface-container-high h-1.5 rounded-full mt-1">
                      <div className="bg-secondary h-full rounded-full" style={{ width: "74.7%" }} />
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="font-semibold text-on-surface">₦115,000 / MT</span>
                    <span className="text-label-sm font-label-sm text-outline block">+ 5% Starch Premium</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="font-semibold text-secondary block">₦43,700,000 Locked</span>
                    <span className="text-label-sm font-label-sm text-outline">Zenith Dual-Key</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded text-label-sm font-label-sm bg-secondary-fixed text-on-secondary-fixed font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> 98.4% SLA</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <button
                      className="px-space-sm py-1 bg-primary text-on-primary rounded text-label-sm font-label-sm hover:bg-primary-container font-semibold transition-colors"
                      type="button"
                      onClick={() => {
                        downloadFile(
                          "Dossier-AGR-CTR-2026-081.txt",
                          "MASTER CONTRACT DOSSIER #AGR-CTR-2026-081\nBuyer: Psaltry International PLC\nSeller: Iseyin Cassava Outgrowers Cooperative\nCrop: Industrial Cassava Roots (TME-419)\nTotal Quota: 1,500 MT (1,120 MT Cleared)\nGate Price: NGN 115,000 / MT (+ 5% Starch Premium)\nEscrow Partner: Zenith Dual-Key Release (NGN 43,700,000 Locked)\nUnderwriter: Leadway Assurance Agricultural Bond\nSLA Compliance: 98.4%",
                          "text/plain"
                        );
                        showScreenToast("Master Dossier #AGR-CTR-2026-081 downloaded.");
                      }}
                    >
                      Inspect Dossier
                    </button>
                  </td>
                </tr>
                <tr className="bg-surface-container-low/50 hover:bg-surface-container-low transition-colors">
                  <td className="py-space-md px-space-md font-semibold text-primary">
                    <div>#AGR-CTR-2026-094</div>
                    <span className="text-label-sm font-label-sm text-outline">SHA256: 0x9a3e..104</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="font-semibold text-on-surface block">Grand Cereals Ltd</span>
                    <span className="text-label-sm font-label-sm text-outline">Oluyole Terminal</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="text-on-surface block">Iseyin Savanna Growers</span>
                    <span className="text-label-sm font-label-sm text-outline">310 Growers</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="font-medium text-on-surface block">Yellow Maize (SAMMAZ)</span>
                    <span className="text-label-sm font-label-sm text-secondary font-semibold">Moisture ≤ 13.0%</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="font-semibold text-on-surface">850 / 1,200 MT</span>
                    <div className="w-24 bg-surface-container-high h-1.5 rounded-full mt-1">
                      <div className="bg-secondary h-full rounded-full" style={{ width: "70.8%" }} />
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="font-semibold text-on-surface">₦420,000 / MT</span>
                    <span className="text-label-sm font-label-sm text-outline block">Fixed Price Gate</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="font-semibold text-secondary block">₦147,000,000 Locked</span>
                    <span className="text-label-sm font-label-sm text-outline">Zenith Corporate LC</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded text-label-sm font-label-sm bg-secondary-fixed text-on-secondary-fixed font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> 99.1% SLA</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <button
                      className="px-space-sm py-1 bg-surface-container text-on-surface rounded text-label-sm font-label-sm hover:bg-surface-container-high font-semibold transition-colors"
                      type="button"
                      onClick={() => {
                        downloadFile(
                          "Dossier-AGR-CTR-2026-094.txt",
                          "MASTER CONTRACT DOSSIER #AGR-CTR-2026-094\nBuyer: Grand Cereals Ltd (Oluyole Terminal)\nSeller: Iseyin Savanna Growers\nCrop: Yellow Maize (SAMMAZ)\nTotal Quota: 1,200 MT (850 MT Cleared)\nGate Price: NGN 420,000 / MT (Fixed Price Gate)\nEscrow Partner: Zenith Corporate LC (NGN 147,000,000 Locked)\nSLA Compliance: 99.1%",
                          "text/plain"
                        );
                        showScreenToast("Master Dossier #AGR-CTR-2026-094 downloaded.");
                      }}
                    >
                      Inspect Dossier
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="py-space-md px-space-md font-semibold text-primary">
                    <div>#AGR-CTR-2026-105</div>
                    <span className="text-label-sm font-label-sm text-outline">SHA256: 0x3d41..9c2</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="font-semibold text-on-surface block">Premium Edible Oils</span>
                    <span className="text-label-sm font-label-sm text-outline">Ede Complex</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="text-on-surface block">Oke-Ogun Soya Alliance</span>
                    <span className="text-label-sm font-label-sm text-outline">220 Growers</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="font-medium text-on-surface block">Soybeans (TGX-1448E)</span>
                    <span className="text-label-sm font-label-sm text-secondary font-semibold">Oil ≥ 19.0%</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="font-semibold text-on-surface">610 / 800 MT</span>
                    <div className="w-24 bg-surface-container-high h-1.5 rounded-full mt-1">
                      <div className="bg-secondary h-full rounded-full" style={{ width: "76.3%" }} />
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="font-semibold text-on-surface">₦680,000 / MT</span>
                    <span className="text-label-sm font-label-sm text-outline block">+ Quality Bonus Cleared</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="font-semibold text-secondary block">₦129,200,000 Locked</span>
                    <span className="text-label-sm font-label-sm text-outline">Zenith Escrow Vault</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded text-label-sm font-label-sm bg-secondary-fixed text-on-secondary-fixed font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> 96.0% SLA</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <button
                      className="px-space-sm py-1 bg-surface-container text-on-surface rounded text-label-sm font-label-sm hover:bg-surface-container-high font-semibold transition-colors"
                      type="button"
                      onClick={() => {
                        downloadFile(
                          "Dossier-AGR-CTR-2026-105.txt",
                          "MASTER CONTRACT DOSSIER #AGR-CTR-2026-105\nBuyer: Premium Edible Oils (Ede Complex)\nSeller: Oke-Ogun Soya Alliance\nCrop: Soybeans (TGX-1448E)\nTotal Quota: 800 MT (610 MT Cleared)\nGate Price: NGN 680,000 / MT (+ Quality Bonus Cleared)\nEscrow Partner: Zenith Escrow Vault (NGN 129,200,000 Locked)\nSLA Compliance: 96.0%",
                          "text/plain"
                        );
                        showScreenToast("Master Dossier #AGR-CTR-2026-105 downloaded.");
                      }}
                    >
                      Inspect Dossier
                    </button>
                  </td>
                </tr>
                <tr className="bg-surface-container-low/50 hover:bg-surface-container-low transition-colors">
                  <td className="py-space-md px-space-md font-semibold text-primary">
                    <div>#AGR-CTR-2026-112</div>
                    <span className="text-label-sm font-label-sm text-outline">SHA256: 0x7e29..bb4</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="font-semibold text-on-surface block">Olam Agri</span>
                    <span className="text-label-sm font-label-sm text-outline">Sagamu Rice Mill</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="text-on-surface block">Egba Rice Farmers</span>
                    <span className="text-label-sm font-label-sm text-outline">130 Growers</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="font-medium text-on-surface block">Paddy Rice (Faro 44)</span>
                    <span className="text-label-sm font-label-sm text-outline font-semibold">Milling Yield ≥ 68%</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="font-semibold text-on-surface">310 / 500 MT</span>
                    <div className="w-24 bg-surface-container-high h-1.5 rounded-full mt-1">
                      <div className="bg-secondary h-full rounded-full" style={{ width: "62.0%" }} />
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="font-semibold text-on-surface">₦540,000 / MT</span>
                    <span className="text-label-sm font-label-sm text-outline block">Indexed Floor</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="font-semibold text-secondary block">₦102,600,000 Locked</span>
                    <span className="text-label-sm font-label-sm text-outline">Zenith Escrow Vault</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded text-label-sm font-label-sm bg-surface-container-high text-primary font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> 94.8% SLA</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <button
                      className="px-space-sm py-1 bg-surface-container text-on-surface rounded text-label-sm font-label-sm hover:bg-surface-container-high font-semibold transition-colors"
                      type="button"
                      onClick={() => {
                        downloadFile(
                          "Dossier-AGR-CTR-2026-112.txt",
                          "MASTER CONTRACT DOSSIER #AGR-CTR-2026-112\nBuyer: Olam Agri (Sagamu Rice Mill)\nSeller: Egba Rice Farmers\nCrop: Paddy Rice (Faro 44)\nTotal Quota: 500 MT (310 MT Cleared)\nGate Price: NGN 540,000 / MT (Indexed Floor)\nEscrow Partner: Zenith Escrow Vault (NGN 102,600,000 Locked)\nSLA Compliance: 94.8%",
                          "text/plain"
                        );
                        showScreenToast("Master Dossier #AGR-CTR-2026-112 downloaded.");
                      }}
                    >
                      Inspect Dossier
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="py-space-md px-space-md font-semibold text-primary">
                    <div>#AGR-CTR-2026-118</div>
                    <span className="text-label-sm font-label-sm text-outline">SHA256: 0x110a..49f</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="font-semibold text-on-surface block">Nestlé Nigeria PLC</span>
                    <span className="text-label-sm font-label-sm text-outline">Agbara Factory</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="text-on-surface block">Ogun Sorghum Clusters</span>
                    <span className="text-label-sm font-label-sm text-outline">180 Growers</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="font-medium text-on-surface block">White Sorghum (CSR-01)</span>
                    <span className="text-label-sm font-label-sm text-secondary font-semibold">Aflatoxin &lt; 4.0 ppb</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="font-semibold text-on-surface">520 / 600 MT</span>
                    <div className="w-24 bg-surface-container-high h-1.5 rounded-full mt-1">
                      <div className="bg-secondary h-full rounded-full" style={{ width: "86.7%" }} />
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="font-semibold text-on-surface">₦490,000 / MT</span>
                    <span className="text-label-sm font-label-sm text-outline block">Premium Food Grade</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="font-semibold text-secondary block">₦39,200,000 Locked</span>
                    <span className="text-label-sm font-label-sm text-outline">Zenith Escrow Vault</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded text-label-sm font-label-sm bg-secondary-fixed text-on-secondary-fixed font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> 99.8% SLA</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <button
                      className="px-space-sm py-1 bg-surface-container text-on-surface rounded text-label-sm font-label-sm hover:bg-surface-container-high font-semibold transition-colors"
                      type="button"
                      onClick={() => {
                        downloadFile(
                          "Dossier-AGR-CTR-2026-118.txt",
                          "MASTER CONTRACT DOSSIER #AGR-CTR-2026-118\nBuyer: Nestlé Nigeria PLC (Agbara Factory)\nSeller: Ogun Sorghum Clusters\nCrop: White Sorghum (CSR-01)\nTotal Quota: 600 MT (520 MT Cleared)\nGate Price: NGN 490,000 / MT (Premium Food Grade)\nEscrow Partner: Zenith Escrow Vault (NGN 39,200,000 Locked)\nAflatoxin Max: 4.0 ppb\nSLA Compliance: 99.8%",
                          "text/plain"
                        );
                        showScreenToast("Master Dossier #AGR-CTR-2026-118 downloaded.");
                      }}
                    >
                      Inspect Dossier
                    </button>
                  </td>
                </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between pt-space-md mt-space-sm text-body-sm font-body-sm text-on-surface-variant">
            <span>Showing 5 of 24 active master contracts (All registered under CAMA 2020)</span>
            <div className="flex items-center gap-space-xs">
              <button
                className="px-space-sm py-1 rounded bg-surface-container font-label-sm text-label-sm text-on-surface hover:bg-surface-container-high disabled:opacity-50"
                type="button"
                disabled={activePage === 1}
                onClick={() => {
                  const p = Math.max(1, activePage - 1);
                  setActivePage(p);
                  showScreenToast(`Viewing page ${p} of master contracts`);
                }}
              >
                Previous
              </button>
              <button
                className={`px-space-sm py-1 rounded font-label-sm text-label-sm font-semibold transition-colors ${activePage === 1 ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface hover:bg-surface-container-high"}`}
                type="button"
                onClick={() => {
                  setActivePage(1);
                  showScreenToast("Viewing page 1 of master contracts");
                }}
              >
                1
              </button>
              <button
                className={`px-space-sm py-1 rounded font-label-sm text-label-sm font-semibold transition-colors ${activePage === 2 ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface hover:bg-surface-container-high"}`}
                type="button"
                onClick={() => {
                  setActivePage(2);
                  showScreenToast("Viewing page 2 of master contracts");
                }}
              >
                2
              </button>
              <button
                className={`px-space-sm py-1 rounded font-label-sm text-label-sm font-semibold transition-colors ${activePage === 3 ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface hover:bg-surface-container-high"}`}
                type="button"
                onClick={() => {
                  setActivePage(3);
                  showScreenToast("Viewing page 3 of master contracts");
                }}
              >
                3
              </button>
              <button
                className="px-space-sm py-1 rounded bg-surface-container font-label-sm text-label-sm text-on-surface hover:bg-surface-container-high disabled:opacity-50"
                type="button"
                disabled={activePage === 3}
                onClick={() => {
                  const p = Math.min(3, activePage + 1);
                  setActivePage(p);
                  showScreenToast(`Viewing page ${p} of master contracts`);
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg">
          <div className="xl:col-span-7 flex flex-col gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-space-sm">
              <div>
                <div className="flex items-center gap-space-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
                  <span className="font-headline-md text-headline-md text-primary">Live Settlement &amp; Escrow Inspector</span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Underwriting Contract <strong>#AGR-CTR-2026-081</strong> · Milestone 3 of 3 (Final 380 MT Consignment)</span>
              </div>
              <span className="px-space-sm py-1 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Inspection Passed · Dual Keys Ready</span>
            </div>
            <div className="bg-surface-container-low p-space-md rounded-xl space-y-space-md">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md uppercase tracking-wider text-outline font-semibold">Weighbridge Intake &amp; Near-Infrared (NIR) Assay</span>
                <span className="text-label-sm font-label-sm text-on-surface font-medium">Ticket: #WB-2026-0492</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm">
                <div className="bg-surface-container-lowest p-space-sm rounded-lg">
                  <span className="text-outline text-label-sm font-label-sm block">Delivered Gross</span>
                  <span className="font-metric-num text-metric-num text-on-surface block mt-0.5">382.4 MT</span>
                  <span className="text-secondary font-label-sm text-label-sm font-semibold">±0.6% Tolerance Ok</span>
                </div>
                <div className="bg-surface-container-lowest p-space-sm rounded-lg">
                  <span className="text-outline text-label-sm font-label-sm block">NIR Starch Assay</span>
                  <span className="font-metric-num text-metric-num text-on-surface block mt-0.5">25.4%</span>
                  <span className="text-secondary font-label-sm text-label-sm font-semibold">&gt;24.0% (+1.5% Bonus)</span>
                </div>
                <div className="bg-surface-container-lowest p-space-sm rounded-lg">
                  <span className="text-outline text-label-sm font-label-sm block">Foreign Matter</span>
                  <span className="font-metric-num text-metric-num text-on-surface block mt-0.5">0.6%</span>
                  <span className="text-secondary font-label-sm text-label-sm font-semibold">&lt;1.5% Strict Pass</span>
                </div>
                <div className="bg-surface-container-lowest p-space-sm rounded-lg">
                  <span className="text-outline text-label-sm font-label-sm block">Moisture Level</span>
                  <span className="font-metric-num text-metric-num text-on-surface block mt-0.5">12.2%</span>
                  <span className="text-secondary font-label-sm text-label-sm font-semibold">≤13.0% Target Met</span>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-md space-y-space-xs">
              <span className="font-label-md text-label-md uppercase tracking-wider text-outline font-semibold block mb-space-xs">Milestone 3 Automated Escrow Reconciliation Math</span>
              <div className="flex items-center justify-between text-body-sm font-body-sm py-1">
                <span className="text-on-surface">Base Consignment Contract Payout (380.0 MT × ₦115,000 / MT)</span>
                <span className="font-semibold text-on-surface">₦43,700,000.00</span>
              </div>
              <div className="flex items-center justify-between text-body-sm font-body-sm py-1 text-secondary">
                <span className="flex items-center gap-1"><Icon name="add_circle" className="text-[16px]" /> High-Starch Assay Quality Bonus (+1.5% on Base Val)</span>
                <span className="font-semibold">+₦655,500.00</span>
              </div>
              <div className="flex items-center justify-between text-body-sm font-body-sm py-1 text-on-tertiary-fixed-variant">
                <span className="flex items-center gap-1"><Icon name="remove_circle" className="text-[16px]" /> Haulage Fleet Pre-funding Deduction (Leadway Agro-Logistics Batch #77)</span>
                <span className="font-semibold">-₦1,850,000.00</span>
              </div>
              <div className="pt-space-sm mt-space-xs flex items-center justify-between bg-surface-container-low p-space-md rounded-lg">
                <div>
                  <span className="font-label-sm text-label-sm text-outline block uppercase">Net Escrow Payout to Outgrowers Union</span>
                  <span className="font-headline-md text-headline-md text-primary font-bold">₦42,505,500.00</span>
                </div>
                <span className="px-space-sm py-1 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Ready for Instant Core-Banking Dispatch</span>
              </div>
            </div>
            <div className="space-y-space-xs">
              <span className="font-label-sm text-label-sm text-outline uppercase font-semibold">Tripartite Cryptographic Attestation Verification</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-xs">
                <div className="flex items-center gap-space-xs p-space-sm rounded bg-surface-container-low text-body-sm font-body-sm">
                  <Icon name="check_circle" className="text-secondary text-[20px]" />
                  <div className="truncate">
                    <span className="font-semibold text-on-surface block truncate">Engr. K. Balogun</span>
                    <span className="text-label-sm font-label-sm text-outline truncate">Off-taker Quality Lead</span>
                  </div>
                </div>
                <div className="flex items-center gap-space-xs p-space-sm rounded bg-surface-container-low text-body-sm font-body-sm">
                  <Icon name="check_circle" className="text-secondary text-[20px]" />
                  <div className="truncate">
                    <span className="font-semibold text-on-surface block truncate">Chief A. Tijani</span>
                    <span className="text-label-sm font-label-sm text-outline truncate">Co-op Biometric Auth</span>
                  </div>
                </div>
                <div className="flex items-center gap-space-xs p-space-sm rounded bg-surface-container-low text-body-sm font-body-sm">
                  <Icon name="check_circle" className="text-secondary text-[20px]" />
                  <div className="truncate">
                    <span className="font-semibold text-on-surface block truncate">Weighbridge Cert</span>
                    <span className="text-label-sm font-label-sm text-outline truncate">#WB-2026-0492 Hash</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-space-sm pt-space-xs">
              <button
                onClick={handleAuthorizeMilestone}
                disabled={authorizedPayout}
                className="flex-1 inline-flex items-center justify-center gap-space-xs px-space-md py-3 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container transition-colors shadow-md font-semibold disabled:opacity-60"
                type="button"
              >
                <Icon name="lock_open" className="text-[20px]" />
                <span>{authorizedPayout ? "Milestone 3 Payout Authorized" : "Authorize Milestone 3 Payout (₦42.51M)"}</span>
              </button>
              <button
                onClick={handleGenerateWaybill}
                className="inline-flex items-center gap-space-xs px-space-md py-3 rounded-lg bg-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high transition-colors shadow-sm font-semibold"
                type="button"
              >
                <Icon name="receipt_long" className="text-[20px]" />
                <span>Generate e-Waybill &amp; Receipt</span>
              </button>
            </div>
          </div>
          <div className="xl:col-span-5 flex flex-col gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm justify-between">
            <div className="space-y-space-md">
              <div>
                <div className="flex items-center gap-space-xs">
                  <Icon name="policy" className="text-primary text-[22px]" />
                  <h3 className="font-headline-md text-headline-md text-primary">Legal Safeguards &amp; Force Majeure Center</h3>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Automated compliance checks, anti-side-selling covenants, and statutory hedge triggers.</p>
              </div>
              <div className="flex items-start gap-space-sm p-space-md rounded-lg bg-surface-container-low">
                <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="satellite_alt" className="text-[18px]" />
                </div>
                <div>
                  <span className="font-label-lg text-label-lg font-semibold text-on-surface block">Side-Selling Prevention Geofence</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">480 enrolled farm perimeters continuously cross-referenced with regional haulage manifests. Zero uncontracted route deviations detected.</p>
                  <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-semibold mt-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> 100% Boundary Fidelity</span>
                </div>
              </div>
              <div className="flex items-start gap-space-sm p-space-md rounded-lg bg-surface-container-low">
                <div className="w-8 h-8 rounded-lg bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="cloud" className="text-[18px]" />
                </div>
                <div>
                  <span className="font-label-lg text-label-lg font-semibold text-on-surface block">Weather &amp; Drought Index Hedge</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Leadway Agrisure satellite parametric policy #LWA-992 active. Trigger threshold: &lt;18mm cumulative rainfall across consecutive 21-day spell.</p>
                  <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-on-surface font-semibold mt-1">Hedge Active · ₦150,000,000 Maximum Cover</span>
                </div>
              </div>
              <div className="flex items-start gap-space-sm p-space-md rounded-lg bg-surface-container-low">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="price_check" className="text-[18px]" />
                </div>
                <div>
                  <span className="font-label-lg text-label-lg font-semibold text-on-surface block">Price Floor Adjustment Mechanism</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Guaranteed minimum floor of ₦115,000/MT with 30-day moving average index upside sharing (60/40 Co-op favour).</p>
                  <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-semibold mt-1">Floor Active · Index Delta: +4.2%</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-md rounded-lg">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-sm text-label-sm uppercase font-semibold text-outline">Statutory Dispute Clause (§11.3)</span>
                  <span className="text-label-sm font-label-sm text-secondary font-semibold">Pre-Agreed 5-Day Fast-Track</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Binding Lagos Court of Arbitration (LCA) expedited rules apply. Direct interface to CultivaNode Proof-of-Work (PoW) dispute resolution pipeline.</p>
                <div className="flex items-center gap-space-sm mt-space-sm">
                  <span className="font-label-sm text-label-sm text-on-surface">NDPA 2023 Consent: <strong>100% Executed</strong></span>
                  <span className="text-outline">·</span>
                  <span className="font-label-sm text-label-sm text-on-surface">Stamp Duty: <strong>Paid (FIRS Stamp #401)</strong></span>
                </div>
              </div>
              <div>
                <span className="font-label-sm text-label-sm uppercase font-semibold text-outline block mb-space-xs">Vaulted Legal Covenants &amp; Instruments</span>
                <div className="space-y-space-xs font-body-sm text-body-sm">
                  <a className="flex items-center justify-between p-space-xs px-space-sm rounded bg-surface-container-low hover:bg-surface-container-high text-on-surface transition-colors" href="/api/documents/outgrower-covenant">
                    <div className="flex items-center gap-space-xs truncate">
                      <Icon name="description" className="text-[18px] text-primary" />
                      <span className="truncate font-medium">Psaltry_AdoAwaye_MasterAgreement_2026.pdf</span>
                    </div>
                    <span className="text-label-sm font-label-sm text-outline shrink-0">SHA-256 Valid</span>
                  </a>
                  <a className="flex items-center justify-between p-space-xs px-space-sm rounded bg-surface-container-low hover:bg-surface-container-high text-on-surface transition-colors" href="/api/documents/escrow-guarantee">
                    <div className="flex items-center gap-space-xs truncate">
                      <Icon name="account_balance" className="text-[18px] text-primary" />
                      <span className="truncate font-medium">Zenith_Bank_Tripartite_Escrow_Guarantee.pdf</span>
                    </div>
                    <span className="text-label-sm font-label-sm text-outline shrink-0">Executed</span>
                  </a>
                  <a className="flex items-center justify-between p-space-xs px-space-sm rounded bg-surface-container-low hover:bg-surface-container-high text-on-surface transition-colors" href="/api/documents/coop-ratification">
                    <div className="flex items-center gap-space-xs truncate">
                      <Icon name="how_to_reg" className="text-[18px] text-primary" />
                      <span className="truncate font-medium">Co-op_General_Assembly_Ratification_Minute.pdf</span>
                    </div>
                    <span className="text-label-sm font-label-sm text-outline shrink-0">Tier 1 Signed</span>
                  </a>
                </div>
              </div>
            </div>
            <div className="pt-space-sm mt-space-xs flex items-center justify-between text-label-sm font-label-sm">
              <span className="text-outline">Need rapid legal amendment?</span>
              <Link className="text-primary font-semibold hover:underline inline-flex items-center gap-1" href={`/${lang}/contact?subject=legal-council-escalation`}>Escalate to CultivaNode Legal Council →</Link>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-xl shadow-sm text-on-surface-variant font-body-sm text-body-sm">
          <div className="flex flex-wrap items-center gap-space-lg">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span className="font-label-sm text-label-sm font-semibold text-on-surface">Zenith Bank Escrow Vault Gateway: 100% Online</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Icon name="sync" className="text-[16px] text-secondary" />
              <span className="font-label-sm text-label-sm">PowerSync SQLite Edge Ingress: Synchronized</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Icon name="sms" className="text-[16px] text-primary" />
              <span className="font-label-sm text-label-sm">Termii SMS Outgrower Broadcast: 1,140 Verified Handsets</span>
            </div>
          </div>
          <div className="flex items-center gap-space-md text-label-sm font-label-sm">
            <span className="text-outline">Protocol §6.7 Rev 4.8</span>
            <span className="px-space-xs py-0.5 rounded bg-surface-container font-semibold text-on-surface">Oyo / Osun / Ogun Cluster</span>
          </div>
        </div>

        {/* Interactive Contract Modals */}
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-space-md backdrop-blur-xs">
            <div className="bg-surface-container-lowest rounded-xl max-w-xl w-full p-space-lg shadow-elevation-3 border border-outline-variant flex flex-col gap-space-md animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-outline-variant pb-space-sm">
                <div className="flex items-center gap-space-xs text-primary font-headline-sm">
                  <Icon name={activeModal === "settlement" ? "account_balance" : activeModal === "waybills" ? "receipt_long" : "biotech"} className="text-[22px]" />
                  <span>
                    {activeModal === "settlement" && "Live Escrow Settlement Console (§6.7)"}
                    {activeModal === "waybills" && "Dossier & Transit Waybill Registry"}
                    {activeModal === "quality" && "Lab Quality Assay & Certificate Audit"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container"
                >
                  <Icon name="close" className="text-[20px]" />
                </button>
              </div>

              <div className="text-body-sm text-on-surface space-y-space-sm">
                {activeModal === "settlement" && (
                  <>
                    <p className="text-on-surface-variant">Zenith Bank automated escrow ledger for contract #AGR-CTR-2026-081:</p>
                    <div className="p-space-sm bg-surface-container-low rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span>Milestone 1 (500 MT):</span>
                        <strong className="text-secondary">₦57,500,000 Disbursed (28 Apr)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Milestone 2 (620 MT):</span>
                        <strong className="text-secondary">₦71,300,000 Disbursed (18 May)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Milestone 3 (380 MT):</span>
                        <strong className={authorizedPayout ? "text-secondary" : "text-primary"}>
                          {authorizedPayout ? "₦42,510,000 Authorized & Released" : "₦43,700,000 Held in Escrow"}
                        </strong>
                      </div>
                    </div>
                    <div className="p-space-xs bg-surface-container text-label-sm rounded flex items-center justify-between">
                      <span>Total Value: ₦172,500,000</span>
                      <span className="text-secondary font-bold">100% NIBSS Instant Clearing</span>
                    </div>
                  </>
                )}

                {activeModal === "waybills" && (
                  <>
                    <p className="text-on-surface-variant">Certified electronic waybills for active produce haulage:</p>
                    <div className="space-y-2">
                      <div className="p-space-sm bg-surface-container-low rounded flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-on-surface">#WB-2026-9921 · 28.5 MT</div>
                          <div className="text-label-sm text-outline">Bedford Tipper OYO-442-XA → Psaltry</div>
                        </div>
                        <span className="text-secondary font-bold text-label-sm">Delivered</span>
                      </div>
                      <div className="p-space-sm bg-surface-container-low rounded flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-on-surface">#WB-2026-9922 · 27.0 MT</div>
                          <div className="text-label-sm text-outline">Mack Truck OG-112-AB → Psaltry</div>
                        </div>
                        <span className="text-primary font-bold text-label-sm">Gate Verified</span>
                      </div>
                    </div>
                  </>
                )}

                {activeModal === "quality" && (
                  <>
                    <p className="text-on-surface-variant">Accredited laboratory quality parameters and certificates:</p>
                    <div className="grid grid-cols-2 gap-space-sm">
                      <div className="p-space-sm bg-surface-container-low rounded">
                        <div className="text-label-sm text-outline">Starch Density Index</div>
                        <div className="text-title-md font-bold text-secondary">24.2% (Target &gt;21.5%)</div>
                      </div>
                      <div className="p-space-sm bg-surface-container-low rounded">
                        <div className="text-label-sm text-outline">Moisture Content</div>
                        <div className="text-title-md font-bold text-secondary">12.7% (Max ≤13.0%)</div>
                      </div>
                      <div className="p-space-sm bg-surface-container-low rounded">
                        <div className="text-label-sm text-outline">Aflatoxin Contaminant</div>
                        <div className="text-title-md font-bold text-secondary">3.2 ppb (Limit ≤10 ppb)</div>
                      </div>
                      <div className="p-space-sm bg-surface-container-low rounded">
                        <div className="text-label-sm text-outline">Certifying Lab</div>
                        <div className="text-title-md font-bold text-on-surface">SON #2026 Assayed</div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-end gap-space-sm pt-space-xs border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => {
                    const csv = `Contract,Modal,Timestamp\nAGR-CTR-2026-081,${activeModal},${new Date().toISOString()}`;
                    downloadFile(`contract-${activeModal}-report.csv`, csv);
                    showScreenToast(`Downloaded ${activeModal} report`);
                  }}
                  className="px-space-md py-1.5 bg-surface-container hover:bg-surface-container-high text-primary font-label-sm rounded text-label-sm font-semibold transition-colors"
                >
                  Download Dossier (.csv)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-space-md py-1.5 bg-primary text-on-primary hover:bg-primary/90 font-label-sm rounded text-label-sm font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
