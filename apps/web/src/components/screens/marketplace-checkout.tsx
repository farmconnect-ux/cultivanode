"use client";

// Ported from the "cart_dispatch_escrow_payment_cultivanode_marketplace" design.
// Augmented with real interactive state: payment rail switching, live haulage recalculation,
// dynamic quantity controls, NUBAN copy, simulated gateway verification, and COA/invoice exports.
import { useState } from "react";
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogAction, ScreenDialogClose, showScreenToast } from "@/components/ds/screen-dialog";
import { downloadFile } from "@/lib/download";
import type { ScreenProps } from "./types";

export function MarketplaceCheckout(_props: ScreenProps) {
  const [selectedRail, setSelectedRail] = useState<"virtual_account" | "card" | "ussd" | "credit">("virtual_account");
  const [deliveryHub, setDeliveryHub] = useState<"saved_ikeja" | "custom_address">("saved_ikeja");
  const [haulageCarrier, setHaulageCarrier] = useState<"cultivanode_transit" | "syndicate_haulage" | "buyer_arranged">("cultivanode_transit");
  
  // Item quantities
  const [maizeQty, setMaizeQty] = useState(5);
  const [garriQty, setGarriQty] = useState(2);
  const [pepperQty, setPepperQty] = useState(3);

  // Card form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardGateway, setCardGateway] = useState<"paystack" | "flutterwave" | "stripe">("paystack");
  const [isProcessingCard, setIsProcessingCard] = useState(false);

  // Pricing calculations
  const maizeTotal = maizeQty * 64000;
  const garriTotal = garriQty * 38000;
  const pepperTotal = pepperQty * 22000;
  const commoditiesSubtotal = maizeTotal + garriTotal + pepperTotal;

  const haulageCost =
    haulageCarrier === "cultivanode_transit"
      ? 42000
      : haulageCarrier === "syndicate_haulage"
      ? 28500
      : 0;

  const totalEscrowLock = commoditiesSubtotal + haulageCost;

  const handleCopyNuban = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("9920481029");
    }
    showScreenToast("Providus NUBAN 9920 481 029 copied to clipboard");
  };

  const handleCopyUssd = (bank: string, code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    showScreenToast(`${bank} USSD string (${code}) copied to clipboard. Dial from registered SIM.`);
  };

  const handleCardPayment = () => {
    setIsProcessingCard(true);
    setTimeout(() => {
      setIsProcessingCard(false);
      showScreenToast(`Payment of ₦${totalEscrowLock.toLocaleString()} successfully authorized via ${cardGateway.toUpperCase()}. Escrow locked.`);
    }, 1200);
  };

  const handleTradeCreditDrawdown = () => {
    showScreenToast(`Facility drawdown of ₦${totalEscrowLock.toLocaleString()} authorized under Net-30 agreement.`);
  };

  const handleDownloadCoa = () => {
    const coaContent = JSON.stringify(
      {
        certificateId: "COA-OYO-0941",
        issuer: "Oyo Agro-Analytics Lab #3 (ISO-17025 Accredited)",
        commodity: "Clean Dry White Maize (Grade A)",
        lotTag: "#LOT-OYO-0941",
        harvestDate: "2026-04-18",
        metrics: {
          moistureLevel: "11.8%",
          standardThreshold: "<13.0%",
          aflatoxinPpb: "<10 ppb",
          purityRating: "99.4% Grade A",
        },
        cryptographicProof: {
          sha256: "9f8a84b8d7a12b69f4b321890cfb63897d2645f8a09b431e51b439818817da02",
          merkleRoot: "0x77c29b01ae94918e772bca0012f99a9b",
          verifiedBy: "CultivaNode Assay Gateway v2.4",
        },
      },
      null,
      2
    );
    downloadFile("COA-LOT-OYO-0941.json", coaContent, "application/json");
    showScreenToast("Certificate of Analysis (COA) cryptographic hash downloaded");
  };

  const handleDownloadProforma = () => {
    const invoice = `CULTIVANODE AGRO-ENTERPRISE PROFORMA INVOICE
==================================================
Session ID: CN-ESCROW-2026-9941
Date: ${new Date().toLocaleDateString("en-NG")}
CBN Escrow Trustee: Providus Bank PLC

BILL TO:
Babatunde Adeleke (Apex Caterers & Wholesale Ltd)
Plot 12 Kudirat Abiola Way, Oregun Industrial Estate, Lagos

ORDER LINE ITEMS:
1. Clean Dry White Maize (Grade A) - ${maizeQty} x 100kg bags @ ₦64,000 = ₦${maizeTotal.toLocaleString()}
2. Fine White Ijebu Garri (Crisp & Dry) - ${garriQty} x 80kg bags @ ₦38,000 = ₦${garriTotal.toLocaleString()}
3. Fresh Tatashe & Rodo Peppers - ${pepperQty} x 25kg crates @ ₦22,000 = ₦${pepperTotal.toLocaleString()}

SUBTOTAL COMMODITIES: ₦${commoditiesSubtotal.toLocaleString()}
LOGISTICS & HAULAGE (${haulageCarrier.toUpperCase()}): ₦${haulageCost.toLocaleString()}
INSURANCE & SPOILAGE COVERAGE: ₦0.00 (Promo)
ESCROW CUSTODY FEE (0.0%): ₦0.00 (Waived)

TOTAL STATUTORY ESCROW DEPOSIT: ₦${totalEscrowLock.toLocaleString()} NGN
==================================================
Settlement Rule: Funds released only upon buyer weighbridge digital PIN confirmation.`;

    downloadFile("CultivaNode-Proforma-CN-ESCROW-9941.txt", invoice, "text/plain");
    showScreenToast("Proforma Invoice downloaded");
  };

  const panelCoaModal = (
    <div className="bg-surface-container-lowest rounded-xl max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between pb-3 border-b border-surface-container-low">
        <div className="flex items-center gap-2">
          <Icon name="verified" className="text-primary text-[24px]" />
          <div>
            <h3 className="text-headline-sm font-headline-sm text-on-surface">Certificate of Analysis (COA)</h3>
            <p className="text-label-sm font-label-sm text-on-surface-variant">CultivaNode Pre-dispatch Commodity Assay</p>
          </div>
        </div>
        <ScreenDialogClose>
          <button className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface" type="button">
            <Icon name="close" className="text-[18px]" />
          </button>
        </ScreenDialogClose>
      </div>
      <div className="mt-4 flex flex-col gap-4 text-body-sm font-body-sm">
        <div className="p-3 bg-surface-container-low rounded-lg flex items-center justify-between">
          <span className="text-on-surface-variant">Commodity:</span>
          <strong className="text-on-surface" id="modal_commodity_name">Clean Dry White Maize</strong>
        </div>
        <div className="p-3 bg-surface-container-low rounded-lg flex items-center justify-between">
          <span className="text-on-surface-variant">PostGIS Batch Tag:</span>
          <strong className="font-mono text-primary" id="modal_lot_tag">#LOT-OYO-0941</strong>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-surface-container-low">
            <span className="text-label-sm font-label-sm text-on-surface-variant">Moisture Level</span>
            <p className="text-headline-sm font-headline-sm text-on-surface font-bold mt-1" id="modal_moisture">11.8%</p>
            <span className="text-[11px] text-secondary font-medium">Standard &lt;13.0% OK</span>
          </div>
          <div className="p-3 rounded-lg bg-surface-container-low">
            <span className="text-label-sm font-label-sm text-on-surface-variant">Toxin / Contaminants</span>
            <p className="text-headline-sm font-headline-sm text-on-surface font-bold mt-1" id="modal_toxin">&lt;10 ppb</p>
            <span className="text-[11px] text-secondary font-medium">Safe for Milling</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-surface-container-low">
            <span className="text-label-sm font-label-sm text-on-surface-variant">Purity Rating</span>
            <p className="text-label-lg font-label-lg text-on-surface font-bold mt-1" id="modal_purity">99.4% Grade A</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-container-low">
            <span className="text-label-sm font-label-sm text-on-surface-variant">Accredited Laboratory</span>
            <p className="text-label-sm font-label-sm text-on-surface font-semibold mt-1" id="modal_lab">Oyo Agro-Analytics Lab #3</p>
          </div>
        </div>
        <div className="p-3 bg-secondary/10 rounded-lg text-secondary text-body-sm font-body-sm flex items-center gap-2">
          <Icon name="task_alt" className="text-[20px]" />
          <span>Sample tested via ISO-17025 standardized spectrometry testing protocol.</span>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-surface-container-low flex justify-end gap-3">
        <ScreenDialogClose>
          <button className="px-4 py-2 rounded-lg bg-surface-container-low text-on-surface font-label-lg text-label-lg hover:bg-surface-container" type="button">Close Preview</button>
        </ScreenDialogClose>
        <button
          onClick={handleDownloadCoa}
          className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container flex items-center gap-1.5 transition-colors"
          type="button"
        >
          <Icon name="file_download" className="text-[16px]" />
          <span>Download Verifiable Hash</span>
        </button>
      </div>
    </div>
  );

  const panelPaymentSuccessModal = (
    <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-6 text-center shadow-2xl">
      <div className="w-16 h-16 rounded-full bg-secondary/15 mx-auto flex items-center justify-center text-secondary mb-4">
        <Icon name="check_circle" className="text-[36px]" />
      </div>
      <h3 className="text-headline-md font-headline-md text-on-surface">Escrow Deposit Confirmed</h3>
      <p className="text-headline-xl-mobile sm:text-headline-xl font-headline-xl text-primary font-bold my-2">₦{totalEscrowLock.toLocaleString()}.00</p>
      <p className="text-body-sm font-body-sm text-on-surface-variant mb-6">
        Funds are securely held in Providus Bank statutory escrow lock under <strong className="text-on-surface">Session #CN-ESCROW-2026-9941</strong>. CultivaNode fleet dispatch order has been routed to Ibadan Regional Staging Node.
      </p>
      <div className="p-3 bg-surface-container-low rounded-lg text-left text-body-sm font-body-sm mb-6 flex flex-col gap-1.5">
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Assigned Hauler:</span>
          <span className="font-semibold text-on-surface">
            {haulageCarrier === "cultivanode_transit"
              ? "CultivaNode Reefer Truck #418"
              : haulageCarrier === "syndicate_haulage"
              ? "Regional Syndicate Flatbed #109"
              : "Self-Arranged Pickup Bay"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Estimated Delivery:</span>
          <span className="font-semibold text-on-surface">Tomorrow 08:30 WAT</span>
        </div>
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Weighbridge Auth PIN:</span>
          <span className="font-mono font-bold text-secondary">#WB-7842</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => showScreenToast("Redirecting to GPS telemetry radar for Reefer #418...")}
          className="w-full py-3 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container transition-colors"
          type="button"
        >
          Go To Live Fleet GPS Tracker
        </button>
        <ScreenDialogClose>
          <button className="w-full py-2.5 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface font-label-lg text-label-lg transition-colors" type="button">Stay on Overview</button>
        </ScreenDialogClose>
      </div>
    </div>
  );

  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <section className="w-full bg-surface-container-low py-6 px-4 sm:px-6 lg:px-12 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-primary/10 text-primary">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> TRANSACTION SESSION #CN-ESCROW-2026-9941
                </span>
                <span className="text-label-sm font-label-sm text-on-surface-variant">• CBN Licensed Escrow Custody</span>
              </div>
              <h1 className="text-headline-md font-headline-md text-on-surface tracking-tight">Checkout, Logistics &amp; Escrow Deposit</h1>
            </div>
            <div className="flex items-center bg-surface-container-lowest px-4 py-2 rounded-xl shadow-sm gap-3">
              <Icon name="verified_user" className="text-primary text-[20px]" />
              <div className="flex flex-col">
                <span className="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant">Active Protection</span>
                <span className="text-body-sm font-body-sm font-semibold text-secondary">Funds Protected via Providus Trust</span>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative">
              <div className="flex items-center gap-3 p-3 bg-surface-container-lowest rounded-xl shadow-sm">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-on-secondary shrink-0">
                  <Icon name="done" className="text-[18px]" />
                </div>
                <div className="min-w-0">
                  <p className="text-label-sm font-label-sm uppercase text-secondary">Step 1 • Confirmed</p>
                  <p className="text-label-lg font-label-lg text-on-surface truncate">Lots Verification</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-surface-container-lowest rounded-xl shadow-sm">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0">
                  <Icon name="local_shipping" className="text-[18px]" />
                </div>
                <div className="min-w-0">
                  <p className="text-label-sm font-label-sm uppercase text-primary font-semibold">Step 2 • Active</p>
                  <p className="text-label-lg font-label-lg text-on-surface truncate">Haulage &amp; Fleet</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-surface-container-lowest rounded-xl shadow-sm ring-1 ring-primary/20">
                <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary shrink-0">
                  <Icon name="account_balance" className="text-[18px]" />
                </div>
                <div className="min-w-0">
                  <p className="text-label-sm font-label-sm uppercase text-primary font-semibold">Step 3 • Pending</p>
                  <p className="text-label-lg font-label-lg text-on-surface truncate">CBN Escrow Lock</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-surface-container-lowest/60 rounded-xl shadow-sm opacity-60">
                <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant shrink-0">
                  <Icon name="scale" className="text-[18px]" />
                </div>
                <div className="min-w-0">
                  <p className="text-label-sm font-label-sm uppercase text-on-surface-variant">Step 4 • On Delivery</p>
                  <p className="text-label-lg font-label-lg text-on-surface truncate">Weighbridge &amp; Release</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 flex flex-col gap-6">
              <section className="bg-surface-container-lowest rounded-xl shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surface-container-low gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Icon name="inventory_2" className="text-primary text-[24px]" />
                      <h2 className="text-headline-sm font-headline-sm text-on-surface">Verified Farmgate Commodities</h2>
                    </div>
                    <p className="text-body-sm font-body-sm text-on-surface-variant mt-0.5">3 traceable lots from verified agronomy syndicates with lab-certified moisture analysis.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-secondary/10 text-secondary text-label-sm font-label-sm flex items-center gap-1">
                      <Icon name="verified" className="text-[14px]" /> 3 Lots Pre-inspected
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-surface-container-low">
                  {/* Article 1: Maize */}
                  <article className="py-5 flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-lg bg-surface-container-low shrink-0 overflow-hidden relative">
                        <img className="w-full h-full object-cover" data-alt="Golden dry kernels of high grade harvested white maize" src="/images/screens/6f08d9b5238a.webp" alt="Maize" loading="lazy" decoding="async" />
                        <span className="absolute bottom-1 right-1 px-1 rounded bg-on-surface/80 text-surface text-[9px] font-mono">GR-A</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-label-lg font-label-lg text-on-surface">Clean Dry White Maize (Grade A)</h3>
                          <span className="px-2 py-0.5 rounded text-label-sm font-label-sm bg-surface-container text-on-surface-variant font-mono">#LOT-OYO-0941</span>
                        </div>
                        <p className="text-body-sm font-body-sm text-on-surface-variant mt-0.5">Origin: Saki West Cluster, Oyo State • PostGIS Traceable</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 text-label-sm font-label-sm px-2 py-0.5 rounded bg-surface-container text-on-surface">
                            <Icon name="water_drop" className="text-[13px] text-secondary" /> Moisture: 11.8%
                          </span>
                          <span className="inline-flex items-center gap-1 text-label-sm font-label-sm px-2 py-0.5 rounded bg-surface-container text-on-surface">
                            <Icon name="health_and_safety" className="text-[13px] text-secondary" /> Aflatoxin &lt;10 ppb
                          </span>
                          <ScreenDialog title="Certificate Of Analysis (COA)" side="center" panel={panelCoaModal}>
                            <button className="text-label-sm font-label-sm text-primary hover:underline flex items-center gap-0.5" type="button">
                              <Icon name="description" className="text-[14px]" /> View COA Lab Sheet
                            </button>
                          </ScreenDialog>
                        </div>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-headline-sm font-headline-sm text-on-surface">₦{maizeTotal.toLocaleString()}</span>
                        <p className="text-label-sm font-label-sm text-on-surface-variant">₦64,000 / 100kg bag</p>
                      </div>
                      <div className="flex items-center gap-2 bg-surface-container-low px-2 py-1 rounded-lg">
                        <button
                          onClick={() => setMaizeQty((q) => Math.max(1, q - 1))}
                          aria-label="Decrease quantity"
                          className="w-6 h-6 flex items-center justify-center rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-colors"
                          type="button"
                        >
                          <Icon name="remove" className="text-[16px]" />
                        </button>
                        <span className="font-label-md font-label-md px-1 text-on-surface">{maizeQty} bags ({maizeQty * 100}kg)</span>
                        <button
                          onClick={() => setMaizeQty((q) => q + 1)}
                          aria-label="Increase quantity"
                          className="w-6 h-6 flex items-center justify-center rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-colors"
                          type="button"
                        >
                          <Icon name="add" className="text-[16px]" />
                        </button>
                      </div>
                    </div>
                  </article>

                  {/* Article 2: Garri */}
                  <article className="py-5 flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-lg bg-surface-container-low shrink-0 overflow-hidden relative">
                        <img className="w-full h-full object-cover" data-alt="Traditional clean crisp white Ijebu garri grains" src="/images/screens/a8ef7044d709.webp" alt="Garri" loading="lazy" decoding="async" />
                        <span className="absolute bottom-1 right-1 px-1 rounded bg-on-surface/80 text-surface text-[9px] font-mono">OGN</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-label-lg font-label-lg text-on-surface">Fine White Ijebu Garri (Crisp &amp; Dry)</h3>
                          <span className="px-2 py-0.5 rounded text-label-sm font-label-sm bg-surface-container text-on-surface-variant font-mono">#LOT-OGN-1142</span>
                        </div>
                        <p className="text-body-sm font-body-sm text-on-surface-variant mt-0.5">Origin: Ijebu-Ode Agro Center, Ogun State • Fermented 4-day</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 text-label-sm font-label-sm px-2 py-0.5 rounded bg-surface-container text-on-surface">
                            <Icon name="water_drop" className="text-[13px] text-secondary" /> Moisture: 9.4%
                          </span>
                          <span className="inline-flex items-center gap-1 text-label-sm font-label-sm px-2 py-0.5 rounded bg-surface-container text-on-surface">
                            <Icon name="tune" className="text-[13px] text-secondary" /> Cyanide Safe (&lt;2ppm)
                          </span>
                          <ScreenDialog title="Certificate Of Analysis (COA)" side="center" panel={panelCoaModal}>
                            <button className="text-label-sm font-label-sm text-primary hover:underline flex items-center gap-0.5" type="button">
                              <Icon name="description" className="text-[14px]" /> View COA Lab Sheet
                            </button>
                          </ScreenDialog>
                        </div>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-headline-sm font-headline-sm text-on-surface">₦{garriTotal.toLocaleString()}</span>
                        <p className="text-label-sm font-label-sm text-on-surface-variant">₦38,000 / 80kg bag</p>
                      </div>
                      <div className="flex items-center gap-2 bg-surface-container-low px-2 py-1 rounded-lg">
                        <button
                          onClick={() => setGarriQty((q) => Math.max(1, q - 1))}
                          aria-label="Decrease quantity"
                          className="w-6 h-6 flex items-center justify-center rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-colors"
                          type="button"
                        >
                          <Icon name="remove" className="text-[16px]" />
                        </button>
                        <span className="font-label-md font-label-md px-1 text-on-surface">{garriQty} bags ({garriQty * 80}kg)</span>
                        <button
                          onClick={() => setGarriQty((q) => q + 1)}
                          aria-label="Increase quantity"
                          className="w-6 h-6 flex items-center justify-center rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-colors"
                          type="button"
                        >
                          <Icon name="add" className="text-[16px]" />
                        </button>
                      </div>
                    </div>
                  </article>

                  {/* Article 3: Peppers */}
                  <article className="py-5 flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-lg bg-surface-container-low shrink-0 overflow-hidden relative">
                        <img className="w-full h-full object-cover" data-alt="Fresh tatashe and rodo peppers in crates" src="/images/screens/82222e092fc6.webp" alt="Peppers" loading="lazy" decoding="async" />
                        <span className="absolute bottom-1 right-1 px-1 rounded bg-on-surface/80 text-surface text-[9px] font-mono">PERISH</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-label-lg font-label-lg text-on-surface">Fresh Tatashe &amp; Rodo Peppers</h3>
                          <span className="px-2 py-0.5 rounded text-label-sm font-label-sm bg-surface-container text-on-surface-variant font-mono">#LOT-HORT-0083</span>
                        </div>
                        <p className="text-body-sm font-body-sm text-on-surface-variant mt-0.5">Origin: Otu Horticultural Cluster, Oyo North • Reefer Priority</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 text-label-sm font-label-sm px-2 py-0.5 rounded bg-surface-container text-on-surface">
                            <Icon name="schedule" className="text-[13px] text-tertiary" /> Morning Harvest (6h ago)
                          </span>
                          <span className="inline-flex items-center gap-1 text-label-sm font-label-sm px-2 py-0.5 rounded bg-surface-container text-on-surface">
                            <Icon name="ac_unit" className="text-[13px] text-secondary" /> Requires Cool Chain
                          </span>
                          <ScreenDialog title="Certificate Of Analysis (COA)" side="center" panel={panelCoaModal}>
                            <button className="text-label-sm font-label-sm text-primary hover:underline flex items-center gap-0.5" type="button">
                              <Icon name="description" className="text-[14px]" /> View Phytosanitary Cert
                            </button>
                          </ScreenDialog>
                        </div>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-headline-sm font-headline-sm text-on-surface">₦{pepperTotal.toLocaleString()}</span>
                        <p className="text-label-sm font-label-sm text-on-surface-variant">₦22,000 / 25kg crate</p>
                      </div>
                      <div className="flex items-center gap-2 bg-surface-container-low px-2 py-1 rounded-lg">
                        <button
                          onClick={() => setPepperQty((q) => Math.max(1, q - 1))}
                          aria-label="Decrease quantity"
                          className="w-6 h-6 flex items-center justify-center rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-colors"
                          type="button"
                        >
                          <Icon name="remove" className="text-[16px]" />
                        </button>
                        <span className="font-label-md font-label-md px-1 text-on-surface">{pepperQty} crates ({pepperQty * 25}kg)</span>
                        <button
                          onClick={() => setPepperQty((q) => q + 1)}
                          aria-label="Increase quantity"
                          className="w-6 h-6 flex items-center justify-center rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-colors"
                          type="button"
                        >
                          <Icon name="add" className="text-[16px]" />
                        </button>
                      </div>
                    </div>
                  </article>
                </div>
                <div className="mt-4 pt-4 border-t border-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between text-body-sm font-body-sm text-on-surface-variant gap-2">
                  <div className="flex items-center gap-2">
                    <Icon name="pin_drop" className="text-[18px] text-secondary" />
                    <span>All 3 lots consolidated at Ibadan Regional Staging Node for batch haulage</span>
                  </div>
                  <span className="font-label-lg font-label-lg text-on-surface">
                    Commodities Subtotal: <strong className="text-primary font-bold">₦{commoditiesSubtotal.toLocaleString()}</strong>
                  </span>
                </div>
              </section>

              {/* Haulage Section */}
              <section className="bg-surface-container-lowest rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 pb-4 border-b border-surface-container-low">
                  <Icon name="local_shipping" className="text-primary text-[24px]" />
                  <div>
                    <h2 className="text-headline-sm font-headline-sm text-on-surface">Haulage &amp; Delivery Logistics</h2>
                    <p className="text-body-sm font-body-sm text-on-surface-variant">Configure point of drop-off, refrigerated fleet allocation, and receiving dock credentials.</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-col gap-4">
                  <div>
                    <label className="block text-label-md font-label-md uppercase tracking-wider text-on-surface-variant mb-1.5">Destination Hub / Drop-off Facility</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label
                        onClick={() => setDeliveryHub("saved_ikeja")}
                        className={`flex items-start gap-3 p-3.5 rounded-lg cursor-pointer transition-colors ${
                          deliveryHub === "saved_ikeja"
                            ? "bg-primary/5 ring-1 ring-primary/40"
                            : "bg-surface-container-low hover:bg-surface-container"
                        }`}
                      >
                        <input
                          checked={deliveryHub === "saved_ikeja"}
                          onChange={() => setDeliveryHub("saved_ikeja")}
                          className="mt-1 text-primary focus:ring-0"
                          name="delivery_hub"
                          type="radio"
                          value="saved_ikeja"
                        />
                        <div className="flex flex-col">
                          <span className="text-label-lg font-label-lg text-on-surface font-semibold">Ikeja Commercial Depot / Warehouse 4</span>
                          <span className="text-body-sm font-body-sm text-on-surface-variant">Plot 12 Kudirat Abiola Way, Oregun Industrial Estate, Lagos</span>
                          <span className="mt-1 text-label-sm font-label-sm text-secondary font-medium">Default Commercial Off-take Address</span>
                        </div>
                      </label>
                      <label
                        onClick={() => setDeliveryHub("custom_address")}
                        className={`flex items-start gap-3 p-3.5 rounded-lg cursor-pointer transition-colors ${
                          deliveryHub === "custom_address"
                            ? "bg-primary/5 ring-1 ring-primary/40"
                            : "bg-surface-container-low hover:bg-surface-container"
                        }`}
                      >
                        <input
                          checked={deliveryHub === "custom_address"}
                          onChange={() => setDeliveryHub("custom_address")}
                          className="mt-1 text-primary focus:ring-0"
                          name="delivery_hub"
                          type="radio"
                          value="custom_address"
                        />
                        <div className="flex flex-col">
                          <span className="text-label-lg font-label-lg text-on-surface font-semibold">Custom Receiving Warehouse / Site</span>
                          <span className="text-body-sm font-body-sm text-on-surface-variant">Enter alternate Lagos, Ogun, or Oyo unloading address</span>
                          <span className="mt-1 text-label-sm font-label-sm text-on-surface-variant">Requires accessible 10-tonne truck dock</span>
                        </div>
                      </label>
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className="block text-label-md font-label-md uppercase tracking-wider text-on-surface-variant mb-2">Select Haulage Syndicate &amp; Cold-Chain Provider</label>
                    <div className="flex flex-col gap-3">
                      <label
                        onClick={() => setHaulageCarrier("cultivanode_transit")}
                        className={`relative flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl cursor-pointer shadow-sm transition-all ${
                          haulageCarrier === "cultivanode_transit"
                            ? "bg-surface-container-lowest ring-2 ring-primary"
                            : "bg-surface-container-low hover:bg-surface-container"
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          <input
                            checked={haulageCarrier === "cultivanode_transit"}
                            onChange={() => setHaulageCarrier("cultivanode_transit")}
                            className="mt-1 text-primary focus:ring-0"
                            name="haulage_carrier"
                            type="radio"
                            value="cultivanode_transit"
                          />
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-label-lg font-label-lg text-on-surface font-bold">CultivaNode Dedicated Transit Fleet (Reefer + Dry)</span>
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-secondary/15 text-secondary uppercase tracking-wider">Recommended</span>
                            </div>
                            <p className="text-body-sm font-body-sm text-on-surface-variant mt-0.5">Dual-compartment telematics truck (4°C active reefer for peppers, 12% RH ventilated dry cabin for maize &amp; garri).</p>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-label-sm font-label-sm text-on-surface">
                              <span className="flex items-center gap-1 text-secondary font-medium">
                                <Icon name="satellite_alt" className="text-[16px]" /> Real-time GPS &amp; Sensor Telemetry
                              </span>
                              <span className="flex items-center gap-1 text-on-surface-variant">
                                <Icon name="schedule" className="text-[16px]" /> 14h transit • ETA Tomorrow 08:30 WAT
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 md:mt-0 text-left md:text-right pl-7 md:pl-0 shrink-0">
                          <span className="text-headline-sm font-headline-sm text-on-surface font-bold">₦42,000</span>
                          <span className="block text-label-sm font-label-sm text-on-surface-variant">Includes transit handling</span>
                        </div>
                      </label>
                      <label
                        onClick={() => setHaulageCarrier("syndicate_haulage")}
                        className={`relative flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl cursor-pointer transition-all ${
                          haulageCarrier === "syndicate_haulage"
                            ? "bg-surface-container-lowest ring-2 ring-primary"
                            : "bg-surface-container-low hover:bg-surface-container"
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          <input
                            checked={haulageCarrier === "syndicate_haulage"}
                            onChange={() => setHaulageCarrier("syndicate_haulage")}
                            className="mt-1 text-primary focus:ring-0"
                            name="haulage_carrier"
                            type="radio"
                            value="syndicate_haulage"
                          />
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-label-lg font-label-lg text-on-surface font-semibold">Regional Agrarian Haulage Syndicate</span>
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-container text-on-surface-variant">Dry Goods Focus</span>
                            </div>
                            <p className="text-body-sm font-body-sm text-on-surface-variant mt-0.5">Shared truck cargo. Standard tarp cover. Depot collection at Mile 12 / Ketu Hub or standard depot dock.</p>
                            <div className="flex items-center gap-2 mt-1.5 text-label-sm font-label-sm text-on-surface-variant">
                              <span className="flex items-center gap-1">
                                <Icon name="schedule" className="text-[16px]" /> 24–36 hour delivery window
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 md:mt-0 text-left md:text-right pl-7 md:pl-0 shrink-0">
                          <span className="text-headline-sm font-headline-sm text-on-surface font-semibold">₦28,500</span>
                          <span className="block text-label-sm font-label-sm text-on-surface-variant">Depot drop-off</span>
                        </div>
                      </label>
                      <label
                        onClick={() => setHaulageCarrier("buyer_arranged")}
                        className={`relative flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl cursor-pointer transition-all ${
                          haulageCarrier === "buyer_arranged"
                            ? "bg-surface-container-lowest ring-2 ring-primary"
                            : "bg-surface-container-low hover:bg-surface-container"
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          <input
                            checked={haulageCarrier === "buyer_arranged"}
                            onChange={() => setHaulageCarrier("buyer_arranged")}
                            className="mt-1 text-primary focus:ring-0"
                            name="haulage_carrier"
                            type="radio"
                            value="buyer_arranged"
                          />
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-label-lg font-label-lg text-on-surface font-semibold">Buyer Self-Arranged Haulage</span>
                            </div>
                            <p className="text-body-sm font-body-sm text-on-surface-variant mt-0.5">Pick up directly from Ibadan Staging Hub. Buyer must generate digital weighbridge pass within 48h.</p>
                          </div>
                        </div>
                        <div className="mt-3 md:mt-0 text-left md:text-right pl-7 md:pl-0 shrink-0">
                          <span className="text-headline-sm font-headline-sm text-secondary font-bold">₦0.00</span>
                          <span className="block text-label-sm font-label-sm text-on-surface-variant">Self pickup gatepass</span>
                        </div>
                      </label>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-surface-container-low grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-label-md font-label-md text-on-surface mb-1">Receiving Officer / Buyer Entity</label>
                      <input className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-lowest ring-1 ring-outline-variant/60 text-body-sm font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" type="text" defaultValue="Babatunde Adeleke (Apex Caterers & Wholesale Ltd)" />
                    </div>
                    <div>
                      <label className="block text-label-md font-label-md text-on-surface mb-1">Primary Receiving Mobile (SMS Waybill Alerts)</label>
                      <input className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-lowest ring-1 ring-outline-variant/60 text-body-sm font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" type="text" defaultValue="+234 803 847 2910" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-label-md font-label-md text-on-surface mb-1">Gate Security &amp; Unloading Dock Instructions</label>
                      <input className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-lowest ring-1 ring-outline-variant/60 text-body-sm font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" placeholder="E.g., Bay 3 for dry grain; please notify Dock Manager Mr. Kenneth upon perimeter gate entry" type="text" defaultValue="Direct to Off-loading Bay 2. Commercial platform scale calibrated for 100kg tare deduction." />
                    </div>
                  </div>
                </div>
              </section>

              {/* Payment Rails Section */}
              <section className="bg-surface-container-lowest rounded-xl shadow-sm p-6">
                <div className="p-4 rounded-xl bg-primary text-on-primary shadow-sm flex flex-col md:flex-row items-start md:items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-on-primary/10 flex items-center justify-center shrink-0">
                    <Icon name="verified_user" className="text-[28px] text-secondary-fixed" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-label-lg font-label-lg font-bold text-on-primary">100% CBN-Compliant Partner Escrow Custody</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-on-primary/20 text-on-primary">ACT-2023-SEC</span>
                    </div>
                    <p className="text-body-sm font-body-sm text-on-primary/90 mt-1 leading-relaxed">
                      Your payment is <strong className="font-bold underline text-secondary-fixed">NOT released to farmers or truck operators immediately</strong>. Funds are locked in a dedicated statutory escrow trust account (Providus Bank / Wema Bank regulated) until independent weighbridge confirmation and digital Proof of Delivery (PoD) sign-off at your warehouse.
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-label-md font-label-md uppercase tracking-wider text-on-surface-variant mb-2">Select Institutional Payment Rail</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-surface-container-low rounded-xl">
                    <button
                      onClick={() => setSelectedRail("virtual_account")}
                      className={`py-2.5 px-3 rounded-lg text-center font-label-lg text-label-lg transition-all flex flex-col items-center justify-center gap-1 ${
                        selectedRail === "virtual_account"
                          ? "bg-surface-container-lowest text-primary shadow-sm ring-1 ring-primary/20"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                      id="tab_rail_virtual_account"
                      type="button"
                    >
                      <Icon name="account_balance" className="text-[20px]" />
                      <span>Dynamic NUBAN</span>
                      <span className="text-[10px] text-secondary font-mono">Instant 30s Webhook</span>
                    </button>
                    <button
                      onClick={() => setSelectedRail("card")}
                      className={`py-2.5 px-3 rounded-lg text-center font-label-lg text-label-lg transition-all flex flex-col items-center justify-center gap-1 ${
                        selectedRail === "card"
                          ? "bg-surface-container-lowest text-primary shadow-sm ring-1 ring-primary/20"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                      id="tab_rail_card"
                      type="button"
                    >
                      <Icon name="credit_card" className="text-[20px]" />
                      <span>Debit / Card</span>
                      <span className="text-[10px] text-on-surface-variant font-mono">Paystack / Stripe</span>
                    </button>
                    <button
                      onClick={() => setSelectedRail("ussd")}
                      className={`py-2.5 px-3 rounded-lg text-center font-label-lg text-label-lg transition-all flex flex-col items-center justify-center gap-1 ${
                        selectedRail === "ussd"
                          ? "bg-surface-container-lowest text-primary shadow-sm ring-1 ring-primary/20"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                      id="tab_rail_ussd"
                      type="button"
                    >
                      <Icon name="dialpad" className="text-[20px]" />
                      <span>USSD Code</span>
                      <span className="text-[10px] text-on-surface-variant font-mono">*737# / *901#</span>
                    </button>
                    <button
                      onClick={() => setSelectedRail("credit")}
                      className={`py-2.5 px-3 rounded-lg text-center font-label-lg text-label-lg transition-all flex flex-col items-center justify-center gap-1 ${
                        selectedRail === "credit"
                          ? "bg-surface-container-lowest text-primary shadow-sm ring-1 ring-primary/20"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                      id="tab_rail_credit"
                      type="button"
                    >
                      <Icon name="handshake" className="text-[20px]" />
                      <span>Trade Credit</span>
                      <span className="text-[10px] text-primary font-mono font-bold">₦12.5M Limit</span>
                    </button>
                  </div>

                  {/* Rail 1: Virtual Account */}
                  {selectedRail === "virtual_account" && (
                    <div className="mt-5 p-5 rounded-xl bg-surface-container-low shadow-sm" id="content_rail_virtual_account">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surface-container gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary font-bold text-headline-sm">🏛️</div>
                          <div>
                            <h4 className="text-label-lg font-label-lg text-on-surface font-semibold">Dedicated NIBSS Instant Clearing Virtual Account</h4>
                            <p className="text-body-sm font-body-sm text-on-surface-variant">Transfer from ANY Nigerian commercial bank app or internet banking</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-1.5 rounded-lg shadow-sm">
                          <Icon name="timer" className="text-tertiary text-[18px]" />
                          <span className="text-label-sm font-label-sm text-on-surface">Valid for:</span>
                          <span className="font-mono text-label-lg font-label-lg font-bold text-tertiary" id="countdown_timer">29:45</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                        <div className="p-3.5 rounded-lg bg-surface-container-lowest shadow-sm">
                          <span className="text-label-sm font-label-sm uppercase text-on-surface-variant">Beneficiary Bank</span>
                          <div className="mt-1 flex items-center gap-1.5">
                            <Icon name="account_balance" className="text-[18px] text-primary" />
                            <strong className="text-label-lg font-label-lg text-on-surface">Providus Bank PLC</strong>
                          </div>
                          <span className="text-[11px] text-secondary font-medium">Auto-Webhook Enabled</span>
                        </div>
                        <div className="p-3.5 rounded-lg bg-surface-container-lowest shadow-sm sm:col-span-2 flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <span className="text-label-sm font-label-sm uppercase text-on-surface-variant">Escrow Account Number (NUBAN)</span>
                            <span className="text-[11px] px-2 py-0.5 rounded bg-secondary/10 text-secondary font-semibold">Unique Session Account</span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="font-mono text-headline-md font-headline-md font-bold tracking-wider text-primary" id="account_number_display">9920 481 029</span>
                            <button
                              onClick={handleCopyNuban}
                              className="px-3 py-1.5 rounded bg-primary text-on-primary hover:bg-primary-container transition-colors text-label-sm font-label-sm flex items-center gap-1"
                              type="button"
                            >
                              <Icon name="content_copy" className="text-[14px]" />
                              <span id="copy_btn_text">Copy</span>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 p-3 rounded-lg bg-surface-container-lowest flex items-center justify-between text-body-sm font-body-sm">
                        <span className="text-on-surface-variant">Beneficiary Account Name:</span>
                        <span className="font-bold text-on-surface">CultivaNode Escrow / Apex Caterers Sub-wallet</span>
                      </div>
                      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-surface-container">
                        <div className="flex items-center gap-2 text-body-sm font-body-sm text-on-surface-variant">
                          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                          <span>Awaiting payment credit notification via NIBSS Settlement Engine...</span>
                        </div>
                        <ScreenDialog title="Escrow Deposit Confirmed" side="center" panel={panelPaymentSuccessModal}>
                          <button className="px-4 py-2 rounded-lg bg-secondary text-on-secondary font-label-lg text-label-lg hover:bg-secondary/90 transition-colors flex items-center justify-center gap-1.5 shadow-sm" type="button">
                            <Icon name="verified" className="text-[18px]" />
                            <span>I Have Sent ₦{totalEscrowLock.toLocaleString()}</span>
                          </button>
                        </ScreenDialog>
                      </div>
                    </div>
                  )}

                  {/* Rail 2: Card */}
                  {selectedRail === "card" && (
                    <div className="mt-5 p-5 rounded-xl bg-surface-container-low shadow-sm" id="content_rail_card">
                      <div className="flex items-center justify-between pb-3 border-b border-surface-container mb-4">
                        <div>
                          <h4 className="text-label-lg font-label-lg text-on-surface font-semibold">Debit or Corporate Card Payment</h4>
                          <p className="text-body-sm font-body-sm text-on-surface-variant">Secured via PCI-DSS Level 1 Encrypted Multi-Gateway Gateway.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={cardGateway}
                            onChange={(e) => setCardGateway(e.target.value as any)}
                            className="text-label-sm font-label-sm px-2.5 py-1 rounded bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none"
                          >
                            <option value="paystack">Paystack</option>
                            <option value="flutterwave">Flutterwave</option>
                            <option value="stripe">Stripe Global</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-label-sm font-label-sm text-on-surface mb-1">Card Number</label>
                          <input
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-lowest ring-1 ring-outline-variant/60 text-body-sm font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="5399 •••• •••• 1289"
                            type="text"
                          />
                        </div>
                        <div>
                          <label className="block text-label-sm font-label-sm text-on-surface mb-1">Expiry Date</label>
                          <input
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-lowest ring-1 ring-outline-variant/60 text-body-sm font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="MM/YY"
                            type="text"
                          />
                        </div>
                        <div>
                          <label className="block text-label-sm font-label-sm text-on-surface mb-1">CVV / Security Code</label>
                          <input
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-lowest ring-1 ring-outline-variant/60 text-body-sm font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                            maxLength={4}
                            placeholder="•••"
                            type="password"
                          />
                        </div>
                      </div>
                      <div className="mt-5 pt-3 border-t border-surface-container flex justify-end">
                        <button
                          onClick={handleCardPayment}
                          disabled={isProcessingCard}
                          className="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                          type="button"
                        >
                          <Icon name="lock" className="text-[18px]" />
                          <span>{isProcessingCard ? "Processing Gateway..." : `Pay ₦${totalEscrowLock.toLocaleString()} via ${cardGateway.toUpperCase()}`}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Rail 3: USSD */}
                  {selectedRail === "ussd" && (
                    <div className="mt-5 p-5 rounded-xl bg-surface-container-low shadow-sm" id="content_rail_ussd">
                      <h4 className="text-label-lg font-label-lg text-on-surface mb-2 font-semibold">USSD Quick Authorization</h4>
                      <p className="text-body-sm font-body-sm text-on-surface-variant mb-4">Click any bank dial code below to copy and authorize instant NIBSS sweep:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div
                          onClick={() => handleCopyUssd("GTBank", `*737*50*${totalEscrowLock}*9941#`)}
                          className="p-3.5 bg-surface-container-lowest rounded-lg text-center cursor-pointer hover:ring-1 hover:ring-primary transition-all"
                        >
                          <span className="text-label-sm font-label-sm text-on-surface-variant">GTBank</span>
                          <p className="font-mono text-label-lg font-label-lg font-bold text-primary mt-1">*737*50*{totalEscrowLock}*9941#</p>
                          <span className="text-[10px] text-secondary font-medium block mt-1">Click to copy</span>
                        </div>
                        <div
                          onClick={() => handleCopyUssd("FirstBank", `*894*${totalEscrowLock}*9941#`)}
                          className="p-3.5 bg-surface-container-lowest rounded-lg text-center cursor-pointer hover:ring-1 hover:ring-primary transition-all"
                        >
                          <span className="text-label-sm font-label-sm text-on-surface-variant">FirstBank</span>
                          <p className="font-mono text-label-lg font-label-lg font-bold text-primary mt-1">*894*{totalEscrowLock}*9941#</p>
                          <span className="text-[10px] text-secondary font-medium block mt-1">Click to copy</span>
                        </div>
                        <div
                          onClick={() => handleCopyUssd("Access Bank", `*901*${totalEscrowLock}*9941#`)}
                          className="p-3.5 bg-surface-container-lowest rounded-lg text-center cursor-pointer hover:ring-1 hover:ring-primary transition-all"
                        >
                          <span className="text-label-sm font-label-sm text-on-surface-variant">Access Bank</span>
                          <p className="font-mono text-label-lg font-label-lg font-bold text-primary mt-1">*901*{totalEscrowLock}*9941#</p>
                          <span className="text-[10px] text-secondary font-medium block mt-1">Click to copy</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rail 4: Trade Credit */}
                  {selectedRail === "credit" && (
                    <div className="mt-5 p-5 rounded-xl bg-surface-container-low shadow-sm" id="content_rail_credit">
                      <div className="flex items-center justify-between pb-3 border-b border-surface-container">
                        <div>
                          <h4 className="text-label-lg font-label-lg text-on-surface font-semibold">Apex Caterers Institutional Credit Facility</h4>
                          <p className="text-body-sm font-body-sm text-on-surface-variant">Active 30-Day Agribusiness Off-take Facility underwritten by Sterling Agro</p>
                        </div>
                        <span className="px-2.5 py-1 rounded bg-secondary/15 text-secondary text-label-sm font-label-sm font-bold">Approved</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="p-3 bg-surface-container-lowest rounded-lg">
                          <span className="text-label-sm font-label-sm text-on-surface-variant">Available Facility Balance</span>
                          <p className="text-headline-sm font-headline-sm font-bold text-primary">₦12,480,000</p>
                        </div>
                        <div className="p-3 bg-surface-container-lowest rounded-lg">
                          <span className="text-label-sm font-label-sm text-on-surface-variant">Repayment Settlement Term</span>
                          <p className="text-label-lg font-label-lg font-bold text-on-surface mt-1">Net 30 Days (0% Interest)</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-surface-container flex justify-end">
                        <button
                          onClick={handleTradeCreditDrawdown}
                          className="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container transition-colors flex items-center gap-2 shadow-sm"
                          type="button"
                        >
                          <Icon name="handshake" className="text-[18px]" />
                          <span>Authorize Drawdown (₦{totalEscrowLock.toLocaleString()})</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Sidebar Order Summary */}
            <aside className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-24">
              <div className="bg-surface-container-lowest rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between pb-4 border-b border-surface-container-low">
                  <h3 className="text-headline-sm font-headline-sm text-on-surface">Escrow Summary</h3>
                  <span className="px-2 py-0.5 rounded text-label-sm font-label-sm bg-primary/10 text-primary font-mono">3 ITEMS</span>
                </div>
                <div className="flex flex-col gap-3 py-4 border-b border-surface-container-low text-body-sm font-body-sm">
                  <div className="flex items-center justify-between text-on-surface">
                    <span className="flex items-center gap-1.5 text-on-surface-variant">
                      <span>Commodities Subtotal (3 Lots)</span>
                    </span>
                    <span className="font-medium">₦{commoditiesSubtotal.toLocaleString()}.00</span>
                  </div>
                  <div className="flex items-center justify-between text-on-surface">
                    <span className="flex items-center gap-1.5 text-on-surface-variant">
                      <span>Inter-State Dedicated Haulage</span>
                    </span>
                    <span className="font-medium">₦{haulageCost.toLocaleString()}.00</span>
                  </div>
                  <div className="flex items-center justify-between text-on-surface">
                    <span className="flex items-center gap-1.5 text-on-surface-variant">
                      <span>Marine &amp; Transit Spoilage Underwriting</span>
                      <Icon name="info" className="text-[14px] text-secondary" label="Covers road hazard & spoilage" />
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[12px] line-through text-on-surface-variant">₦2,520</span>
                      <span className="text-secondary font-bold text-label-sm font-label-sm">₦0.00 (Promo)</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-on-surface">
                    <span className="flex items-center gap-1.5 text-on-surface-variant">
                      <span>CultivaNode Escrow Custody Fee (0.0%)</span>
                    </span>
                    <span className="text-secondary font-bold text-label-sm font-label-sm">₦0.00 (Waived)</span>
                  </div>
                  <div className="flex items-center justify-between text-on-surface">
                    <span className="flex items-center gap-1.5 text-on-surface-variant">
                      <span>Pre-Shipment Moisture &amp; Lab Assay</span>
                    </span>
                    <span className="text-on-surface-variant">Free Inclusion</span>
                  </div>
                </div>
                <div className="py-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-label-md font-label-md uppercase tracking-wider text-on-surface-variant">Total Escrow Lock</span>
                    <span className="text-[11px] text-secondary font-medium">Reversible prior to weighbridge sign-off</span>
                  </div>
                  <div className="text-right">
                    <span className="text-headline-xl-mobile sm:text-headline-xl font-headline-xl text-primary font-bold">₦{totalEscrowLock.toLocaleString()}</span>
                    <span className="block text-label-sm font-label-sm text-on-surface-variant">NGN Flat Rate</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3 mt-2">
                  <ScreenDialog title="Escrow Deposit Confirmed" side="center" panel={panelPaymentSuccessModal}>
                    <button className="w-full py-4 px-6 rounded-lg bg-primary text-on-primary font-headline-sm text-headline-sm hover:bg-primary-container transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group" id="main_lock_btn" type="button">
                      <Icon name="lock" className="text-[22px] group-hover:scale-110 transition-transform" />
                      <span>Lock ₦{totalEscrowLock.toLocaleString()} in Escrow</span>
                    </button>
                  </ScreenDialog>
                  <button
                    onClick={handleDownloadProforma}
                    className="w-full py-2.5 px-4 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-lg text-label-lg transition-colors flex items-center justify-center gap-2"
                    type="button"
                  >
                    <Icon name="download" className="text-[18px]" />
                    <span>Download Proforma Invoice (PDF / Text)</span>
                  </button>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-surface-container-low flex items-start gap-2.5">
                  <Icon name="verified" className="text-secondary text-[20px] shrink-0 mt-0.5" />
                  <p className="text-[12px] leading-relaxed text-on-surface-variant">Buyer Protection SLA: Full or pro-rated settlement refund processed within <strong>4 banking hours</strong> if commodity fails post-dispatch weighbridge calibration.</p>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 pb-3 border-b border-surface-container-low">
                  <Icon name="policy" className="text-primary text-[20px]" />
                  <h4 className="text-label-lg font-label-lg text-on-surface">Escrow Settlement Governance</h4>
                </div>
                <div className="divide-y divide-surface-container-low">
                  <div className="py-3 flex items-start gap-3">
                    <Icon name="scale" className="text-primary text-[18px] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-label-md font-label-md text-on-surface font-semibold">24-Hour Weighbridge Inspection</p>
                      <p className="text-[12px] text-on-surface-variant leading-relaxed mt-0.5">Physical gross vs. tare weight measured upon truck arrival. Escrow release occurs only after buyer digital weighbridge PIN confirmation.</p>
                    </div>
                  </div>
                  <div className="py-3 flex items-start gap-3">
                    <Icon name="water_drop" className="text-primary text-[18px] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-label-md font-label-md text-on-surface font-semibold">Moisture &amp; Foreign Matter SLA</p>
                      <p className="text-[12px] text-on-surface-variant leading-relaxed mt-0.5">Tolerance pegged at 12.5% max for grain. If higher, automatic pro-rata deduction is calculated and returned to your balance.</p>
                    </div>
                  </div>
                  <div className="py-3 flex items-start gap-3">
                    <Icon name="support_agent" className="text-primary text-[18px] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-label-md font-label-md text-on-surface font-semibold">4-Hour Agronomist Arbitration Desk</p>
                      <p className="text-[12px] text-on-surface-variant leading-relaxed mt-0.5">In case of transit spoilage or pest occurrence, a regional independent agronomist inspects the lot within 4 hours in Lagos.</p>
                    </div>
                  </div>
                  <div className="py-3 flex items-start gap-3">
                    <Icon name="security" className="text-primary text-[18px] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-label-md font-label-md text-on-surface font-semibold">NDPA 2023 &amp; 256-bit Encryption</p>
                      <p className="text-[12px] text-on-surface-variant leading-relaxed mt-0.5">All banking tokens, waybill manifests, and syndicate financial accounts are protected under Nigerian Data Protection Regulations.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-surface-container-low flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Icon name="headset_mic" className="text-[20px]" />
                  </div>
                  <div>
                    <p className="text-label-md font-label-md text-on-surface">Escrow Desk Hotline</p>
                    <p className="text-[12px] text-on-surface-variant">+234 (01) 888 4920 • Toll Free</p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded bg-surface-container-lowest text-on-surface text-[11px] font-mono">24/7 Monitored</span>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
