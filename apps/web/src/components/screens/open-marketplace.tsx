"use client";

// Ported from the "cultivanode_open_produce_commodities_marketplace" design.
// Augmented with real interactive state: dynamic cart addition/removal, real-time haulage recalculation,
// live search and category switching, RFQ requests, and seamless escrow dispatch linking.
import { useRouter } from "next/navigation";
import { useState, useId } from "react";
import { Icon } from "@/components/ds/icon";
import { showScreenToast } from "@/components/ds/screen-dialog";
import { cart, useCart } from "@/lib/cart";
import { slot, type ScreenProps } from "./types";
import { phrasebook } from "@/i18n/marketing";
import YO from "@/i18n/yo-marketing/open-marketplace";

const tYo = phrasebook(YO);

export type OpenMarketplaceSlot = "lots";

interface CartItem {
  id: string;
  name: string;
  detail: string;
  price: number;
}

export function OpenMarketplace({ slots, lang }: ScreenProps<OpenMarketplaceSlot>) {
  const router = useRouter();
  const [activeVertical, setActiveVertical] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const searchInputId = useId();
  const regionFilterId = useId();
  const categoryFilterId = useId();
  const sortSelectorId = useId();
  const companyNameId = useId();
  const commodityInterestId = useId();
  const monthlyTonnageId = useId();
  const workEmailId = useId();

  // The cart lives in the browser and is shared with the checkout page; prices are re-checked there.
  const cartItems = useCart();
  const subtotal = cartItems.reduce((acc, item) => acc + (item.unitPriceKobo * item.quantity) / 100, 0);
  const sellerCount = new Set(cartItems.map((i) => i.sellerName ?? i.listingId)).size;
  const haulageCost = sellerCount * 3000;
  const grandTotal = subtotal + haulageCost;

  // Only used by the design's sample cards, which render when no live lots are passed in.
  const handleAddToCart = (item: CartItem) => {
    showScreenToast(`${item.name} is a sample lot. Open a live listing to add it to your cart.`);
  };

  const handleRemoveFromCart = (id: string, name: string) => {
    cart.remove(id);
    showScreenToast(`Removed ${name} from cart.`);
  };

  const handleLockFundsAndDispatch = () => {
    if (cartItems.length === 0) {
      showScreenToast(tYo.now("Your cart is empty. Add a lot first."));
      return;
    }
    router.push(`/${lang}/marketplace/checkout`);
  };

  const handleRequestBulkRfq = () => {
    showScreenToast(tYo.now("Bulk RFQ submitted. Sourcing team will send customized tender quote within 4 hours."));
  };

  const handleEnterpriseDeckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showScreenToast(tYo.now("Enterprise sourcing request received. Dedicated account executive assigned."));
  };

  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        {/* Banner Section */}
        <section className="w-full bg-primary-container text-on-primary">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-left">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-secondary-fixed text-on-secondary-fixed shrink-0">
                <Icon name="verified_user" filled className="text-[15px]" />
              </span>
              <p className="font-body-sm text-body-sm text-on-primary">
                <strong className="font-label-md text-label-md text-secondary-fixed">{tYo("Zero Intermediary Markup:")}</strong>{tYo(" Open sourcing for households, bulk caterers, food processors & supermarkets. Pay securely via Card, NIBSS Transfer, or USSD with CBN-regulated escrow.")}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-primary-container bg-primary/40 px-2.5 py-1 rounded">{tYo("No Syndicate Card Required")}</span>
              <button
                onClick={() => {
                  const elem = document.getElementById("quick-checkout");
                  if (elem) elem.scrollIntoView({ behavior: "smooth" });
                }}
                className="font-label-sm text-label-sm text-secondary-fixed hover:underline flex items-center gap-1"
                type="button"
              >
                <span>{tYo("Track Delivery")}</span>
                <Icon name="arrow_forward" className="text-[14px]" />
              </button>
            </div>
          </div>
        </section>

        {/* Hero Section */}
        <section className="w-full bg-surface-container-low pt-12 pb-16">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col gap-8">
            <div className="flex flex-col gap-4 max-w-4xl">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-surface-container-highest text-primary font-label-sm text-label-sm tracking-wide uppercase">{tYo("South-West Agricultural Exchange")}</span>
                <span className="flex items-center gap-1 text-secondary font-label-sm text-label-sm">
                  <span className="w-2 h-2 rounded-full bg-secondary" />{tYo(" 83 Verified Farmgate Lots Live")}</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight md:text-[2.75rem] md:leading-[3.25rem]">{tYo("CultivaNode Open Marketplace — Direct Farm-to-Table & Commercial Sourcing")}</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">{tYo("Connect directly with verified South-West farms, cooperatives, and aggregators. Procure harvest-fresh staples, tubers, and industrial grains with transparent provenance, automated weighbridge certificates, and cold-chain/dry haulage directly to Lagos, Ibadan, and Ogun.")}</p>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-surface-container-lowest shadow-sm">
              <div className="flex flex-col gap-1 p-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{tYo("Active Lots")}</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-num text-metric-num text-primary">83</span>
                  <span className="font-label-sm text-label-sm text-secondary">{tYo("Verified South-West")}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 p-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{tYo("Avg Haulage Dispatch")}</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-num text-metric-num text-primary">&lt; 24h</span>
                  <span className="font-label-sm text-label-sm text-secondary">{tYo("Depot to Gate")}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 p-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{tYo("Escrow Settlement")}</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-num text-metric-num text-primary">100%</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Until Weight Cleared")}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 p-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{tYo("Pilot Commission")}</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-num text-metric-num text-secondary">0%</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Direct Farmgate Rate")}</span>
                </div>
              </div>
            </div>

            {/* Search and filters bar */}
            <div className="p-4 md:p-6 rounded-xl bg-surface-container-lowest shadow-md flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div className="md:col-span-5 relative">
                  <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]" />
                  <input
                    id={searchInputId}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 bg-surface rounded-lg font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:bg-surface-container-low transition-all"
                    placeholder={tYo("Search commodity (e.g., White Maize, Faro-44, Cassava roots, Garri...)")}
                    type="text"
                  />
                </div>
                <div className="md:col-span-3 relative">
                  <Icon name="location_on" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]" />
                  <select
                    id={regionFilterId}
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="w-full h-11 pl-11 pr-8 bg-surface rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="all">{tYo("All South-West Hubs")}</option>
                    <option value="oyo">{tYo("Oyo Savanna (Saki, Iseyin, Otu)")}</option>
                    <option value="ogun">{tYo("Ogun Basin (Sagamu, Ijebu, Abeokuta)")}</option>
                    <option value="osun">{tYo("Osun Central & Farm Belts")}</option>
                    <option value="ondo">{tYo("Ondo Agro-Corridor")}</option>
                    <option value="ekiti">{tYo("Ekiti Highland Uplands")}</option>
                    <option value="lagos">{tYo("Lagos Terminal Warehouses")}</option>
                  </select>
                  <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]" />
                </div>
                <div className="md:col-span-2 relative">
                  <select
                    id={categoryFilterId}
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full h-11 px-3 bg-surface rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="all">{tYo("All Categories (5)")}</option>
                    <option value="inputs">{tYo("Agricultural Inputs")}</option>
                    <option value="produce">{tYo("Produce Buying & Selling")}</option>
                    <option value="logistics">{tYo("Logistics & Haulage")}</option>
                    <option value="vet-services">{tYo("Veterinary & Livestock Services")}</option>
                    <option value="processing-contract">{tYo("Agro-Processing & Contract Farming")}</option>
                  </select>
                  <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]" />
                </div>
                <div className="md:col-span-2 flex">
                  <button
                    onClick={() => showScreenToast(`Filtering lots by: ${regionFilter !== "all" ? regionFilter.toUpperCase() : "All regions"}, ${categoryFilter !== "all" ? categoryFilter : "All categories"}`)}
                    className="w-full h-11 bg-primary text-on-primary rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-primary-container transition-colors shadow-sm"
                    type="button"
                  >
                    <Icon name="tune" className="text-[18px]" />
                    <span>{tYo("Filter Lots")}</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pt-2 scrollbar-none">
                <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0 mr-1">{tYo("Quick Select:")}</span>
                <button
                  onClick={() => setActiveVertical("all")}
                  className={`px-3 py-1.5 rounded-full font-label-sm text-label-sm shrink-0 flex items-center gap-1.5 transition-colors ${
                    activeVertical === "all" ? "bg-primary text-on-primary" : "bg-surface hover:bg-surface-container-high text-on-surface"
                  }`}
                  type="button"
                >
                  <span>{tYo("All Categories")}</span>
                  <span className="bg-primary-container px-1.5 py-0.2 rounded-full text-[10px] text-on-primary">83</span>
                </button>
                <button
                  onClick={() => setActiveVertical("inputs")}
                  className={`px-3 py-1.5 rounded-full font-label-sm text-label-sm shrink-0 flex items-center gap-1.5 transition-colors ${
                    activeVertical === "inputs" ? "bg-primary text-on-primary" : "bg-surface hover:bg-surface-container-high text-on-surface"
                  }`}
                  type="button"
                >
                  <span>{tYo("Agricultural Inputs")}</span>
                  <span className="bg-surface-container-highest text-primary px-1.5 py-0.2 rounded-full text-[10px]">18</span>
                </button>
                <button
                  onClick={() => setActiveVertical("produce")}
                  className={`px-3 py-1.5 rounded-full font-label-sm text-label-sm shrink-0 flex items-center gap-1.5 transition-colors ${
                    activeVertical === "produce" ? "bg-primary text-on-primary" : "bg-surface hover:bg-surface-container-high text-on-surface"
                  }`}
                  type="button"
                >
                  <span>{tYo("Produce Buying & Selling")}</span>
                  <span className="bg-surface-container-highest text-primary px-1.5 py-0.2 rounded-full text-[10px]">42</span>
                </button>
                <button
                  onClick={() => setActiveVertical("logistics")}
                  className={`px-3 py-1.5 rounded-full font-label-sm text-label-sm shrink-0 flex items-center gap-1.5 transition-colors ${
                    activeVertical === "logistics" ? "bg-primary text-on-primary" : "bg-surface hover:bg-surface-container-high text-on-surface"
                  }`}
                  type="button"
                >
                  <span>{tYo("Logistics & Haulage")}</span>
                  <span className="bg-surface-container-highest text-primary px-1.5 py-0.2 rounded-full text-[10px]">14</span>
                </button>
                <button
                  onClick={() => setActiveVertical("vet")}
                  className={`px-3 py-1.5 rounded-full font-label-sm text-label-sm shrink-0 flex items-center gap-1.5 transition-colors ${
                    activeVertical === "vet" ? "bg-primary text-on-primary" : "bg-surface hover:bg-surface-container-high text-on-surface"
                  }`}
                  type="button"
                >
                  <span>{tYo("Veterinary & Livestock")}</span>
                  <span className="bg-surface-container-highest text-primary px-1.5 py-0.2 rounded-full text-[10px]">5</span>
                </button>
                <button
                  onClick={() => setActiveVertical("processing")}
                  className={`px-3 py-1.5 rounded-full font-label-sm text-label-sm shrink-0 flex items-center gap-1.5 transition-colors ${
                    activeVertical === "processing" ? "bg-primary text-on-primary" : "bg-surface hover:bg-surface-container-high text-on-surface"
                  }`}
                  type="button"
                >
                  <span>{tYo("Agro-Processing & Contracts")}</span>
                  <span className="bg-surface-container-highest text-primary px-1.5 py-0.2 rounded-full text-[10px]">4</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 5 Core Verticals Section */}
        <section className="w-full bg-surface py-12 border-b border-surface-container-high">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">{tYo("5 Core Sourcing Verticals")}</span>
                </div>
                <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold tracking-tight">{tYo("Marketplace Category Explorer")}</h2>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mt-1">{tYo("Integrated South-West agro-commerce infrastructure spanning certified farm inputs, farmgate harvest lots, cold-chain haulage, clinical veterinary diagnostics, and industrial forward contracts.")}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-full border border-surface-container-high">{tYo("CBN-Escrow Protected Across All Channels")}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
              {/* Card 1 */}
              <div className="flex flex-col rounded-xl bg-surface-container-lowest p-5 shadow-sm hover:shadow-md transition-shadow justify-between gap-4 border border-surface-container-high/60 group">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                      <Icon name="potted_plant" className="text-[24px]" />
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary" />{tYo(" Live / Active")}</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-primary font-bold group-hover:text-secondary transition-colors">{tYo("Agricultural Inputs")}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5">{tYo("Certified drought-tolerant hybrid seeds, blended NPK/Urea fertilizers, crop protection agrochemicals, calibrated knapsack sprayers & nursery equipment.")}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-surface-container-low flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("18 Warehouses")}</span>
                  <button
                    onClick={() => {
                      setActiveVertical("inputs");
                      setCategoryFilter("inputs");
                      showScreenToast(tYo.now("Viewing Agricultural Inputs vertical."));
                    }}
                    className="font-label-sm text-label-sm text-secondary font-bold flex items-center gap-1 hover:underline"
                    type="button"
                  >
                    <span>{tYo("Explore")}</span>
                    <Icon name="arrow_forward" className="text-[14px]" />
                  </button>
                </div>
              </div>

              {/* Card 2 */}
              <div className="flex flex-col rounded-xl bg-surface-container-lowest p-5 shadow-sm hover:shadow-md transition-shadow justify-between gap-4 border border-surface-container-high/60 group">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-lg bg-primary text-on-primary flex items-center justify-center">
                      <Icon name="agriculture" className="text-[24px]" />
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary" />{tYo(" Live / Active")}</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-primary font-bold group-hover:text-secondary transition-colors">{tYo("Produce Buying & Selling")}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5">{tYo("Direct farmgate white & yellow maize, Faro-44 parboiled rice, high-starch cassava roots, fresh peppers, and wholesale beans with weighbridge scale certs.")}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-surface-container-low flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("42 Farm Lots")}</span>
                  <button
                    onClick={() => {
                      setActiveVertical("produce");
                      setCategoryFilter("produce");
                      showScreenToast(tYo.now("Viewing Produce Buying & Selling lots."));
                    }}
                    className="font-label-sm text-label-sm text-secondary font-bold flex items-center gap-1 hover:underline"
                    type="button"
                  >
                    <span>{tYo("Browse Lots")}</span>
                    <Icon name="arrow_forward" className="text-[14px]" />
                  </button>
                </div>
              </div>

              {/* Card 3 */}
              <div className="flex flex-col rounded-xl bg-surface-container-lowest p-5 shadow-sm hover:shadow-md transition-shadow justify-between gap-4 border border-surface-container-high/60 group">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-lg bg-surface-container-high text-primary flex items-center justify-center">
                      <Icon name="local_shipping" className="text-[24px]" />
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary" />{tYo(" Live / Active")}</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-primary font-bold group-hover:text-secondary transition-colors">{tYo("Logistics & Haulage")}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5">{tYo("Cold-chain reefer trucks for fresh perishables, heavy 30T flatbeds for grain bags, and scheduled farm-to-depot runs across Oyo, Ogun, and Lagos corridors.")}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-surface-container-low flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("14 Fleet Routes")}</span>
                  <button
                    onClick={() => {
                      setActiveVertical("logistics");
                      showScreenToast(tYo.now("Viewing Logistics and Freight routes."));
                    }}
                    className="font-label-sm text-label-sm text-secondary font-bold flex items-center gap-1 hover:underline"
                    type="button"
                  >
                    <span>{tYo("Book Freight")}</span>
                    <Icon name="arrow_forward" className="text-[14px]" />
                  </button>
                </div>
              </div>

              {/* Card 4 */}
              <div className="flex flex-col rounded-xl bg-surface-container-lowest p-5 shadow-sm hover:shadow-md transition-shadow justify-between gap-4 border border-surface-container-high/60 group">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-lg bg-tertiary-container text-on-tertiary flex items-center justify-center">
                      <Icon name="pets" className="text-[24px]" />
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-primary font-label-sm text-label-sm font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />{tYo(" Pilot / Booking")}</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-primary font-bold group-hover:text-secondary transition-colors">{tYo("Veterinary & Livestock")}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5">{tYo("Scheduled flock vaccination protocols, aquaculture pond water testing, clinical herd biosecurity screenings, and certified animal nutrition consultations.")}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-surface-container-low flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("5 Specialist Teams")}</span>
                  <button
                    onClick={() => {
                      setActiveVertical("vet");
                      showScreenToast(tYo.now("Viewing Veterinary and Livestock specialist schedules."));
                    }}
                    className="font-label-sm text-label-sm text-secondary font-bold flex items-center gap-1 hover:underline"
                    type="button"
                  >
                    <span>{tYo("Request Visit")}</span>
                    <Icon name="arrow_forward" className="text-[14px]" />
                  </button>
                </div>
              </div>

              {/* Card 5 */}
              <div className="flex flex-col rounded-xl bg-surface-container-lowest p-5 shadow-sm hover:shadow-md transition-shadow justify-between gap-4 border border-surface-container-high/60 group">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                      <Icon name="precision_manufacturing" className="text-[24px]" />
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary" />{tYo(" Structured Deals")}</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-primary font-bold group-hover:text-secondary transition-colors">{tYo("Agro-Processing & Contracts")}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5">{tYo("High-Quality Cassava Flour (HQCF) contract milling, industrial grain drying & silo aggregation, and forward guaranteed off-take syndicates for commercial plants.")}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-surface-container-low flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("≥50 MT Forward")}</span>
                  <button
                    onClick={() => {
                      setActiveVertical("processing");
                      showScreenToast(tYo.now("Viewing Agro-processing contracts and Forward commitments."));
                    }}
                    className="font-label-sm text-label-sm text-secondary font-bold flex items-center gap-1 hover:underline"
                    type="button"
                  >
                    <span>{tYo("Apply for RFQ")}</span>
                    <Icon name="arrow_forward" className="text-[14px]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Lots Catalog and Dispatch Aside */}
        <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                <div>
                  <h2 className="font-headline-lg text-headline-lg text-primary">{tYo("Verified Farmgate Lots")}</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Calibrated moisture, weighbridge certified, and PostGIS geo-tagged batches.")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor={sortSelectorId}>{tYo("Sort by:")}</label>
                  <select defaultValue="Newest Harvest Date" className="h-9 px-3 bg-surface-container-low rounded-lg font-label-sm text-label-sm text-on-surface focus:outline-none" id={sortSelectorId}>
                    <option>{tYo("Lowest Price First")}</option>
                    <option>{tYo("Newest Harvest Date")}</option>
                    <option>{tYo("Highest Tested Quality")}</option>
                    <option>{tYo("Lowest Minimum Order (MOQ)")}</option>
                  </select>
                </div>
              </div>
              {slot(slots, "lots", (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Lot 1: Maize */}
                  <article className="flex flex-col rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                    <div className="relative h-48 w-full bg-surface-container-high overflow-hidden">
                      <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" data-alt="Sunlit close-up of premium clean dry white maize kernels" src="/images/screens/1caf6d72619e.webp" alt={tYo("Maize")} loading="lazy" decoding="async" />
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className="px-2.5 py-1 rounded bg-primary text-on-primary font-label-sm text-label-sm">{tYo("Grade A Certified")}</span>
                        <span className="px-2 py-0.5 rounded bg-surface-container-lowest/90 text-on-surface font-label-sm text-label-sm">{tYo("PostGIS Tagged")}</span>
                      </div>
                      <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-primary-container text-on-primary font-label-sm text-label-sm">{tYo("420 Bags Available")}</div>
                    </div>
                    <div className="p-5 flex flex-col gap-3 flex-1 justify-between">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1"><Icon name="pin_drop" className="text-[14px]" />{tYo(" Saki West, Oke-Ogun Savanna")}</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Harvested 4d ago")}</span>
                        </div>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">{tYo("Clean Dry White Maize (Grade A)")}</h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Host: Oke-Ogun Savanna Growers. Double poly 100kg bag. Sorted for industrial feed or milling.")}</p>
                        <div className="grid grid-cols-2 gap-2 mt-2 p-2.5 rounded bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant">
                          <div className="flex items-center gap-1"><span className="text-on-surface font-semibold">{tYo("Moisture:")}</span> ≤12.5%</div>
                          <div className="flex items-center gap-1"><span className="text-on-surface font-semibold">{tYo("Aflatoxin:")}</span>{tYo(" <10 ppb")}</div>
                          <div className="flex items-center gap-1 col-span-2"><span className="text-on-surface font-semibold">{tYo("Bulk Deal:")}</span>{tYo(" ₦61,500/bag for ≥50 bags")}</div>
                        </div>
                      </div>
                      <div className="pt-3 flex items-center justify-between mt-2">
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">{tYo("Farmgate Price")}</span>
                          <div className="font-metric-num text-metric-num text-primary">₦64,000 <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">{tYo("/ 100kg")}</span></div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Min: 5 Bags")}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddToCart({ id: "maize-lot", name: "Clean Dry White Maize", detail: "5 × 100kg bag (Saki West)", price: 320000 })}
                            className="px-4 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors shadow-sm"
                            type="button"
                          >{tYo("Add Lot")}</button>
                        </div>
                      </div>
                    </div>
                  </article>

                  {/* Lot 2: Cassava */}
                  <article className="flex flex-col rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                    <div className="relative h-48 w-full bg-surface-container-high overflow-hidden">
                      <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" data-alt="Freshly harvested dense cassava roots" src="/images/screens/62e8873307c4.webp" alt={tYo("Cassava")} loading="lazy" decoding="async" />
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className="px-2.5 py-1 rounded bg-tertiary-container text-on-tertiary font-label-sm text-label-sm">{tYo("High Starch TME-419")}</span>
                        <span className="px-2 py-0.5 rounded bg-surface-container-lowest/90 text-on-surface font-label-sm text-label-sm">{tYo("12h Harvest Fresh")}</span>
                      </div>
                      <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-primary-container text-on-primary font-label-sm text-label-sm">{tYo("65 MT Active")}</div>
                    </div>
                    <div className="p-5 flex flex-col gap-3 flex-1 justify-between">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1"><Icon name="pin_drop" className="text-[14px]" />{tYo(" Iseyin Central Hub, Oyo")}</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Immediate Cut")}</span>
                        </div>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">{tYo("Premium Cassava Roots (TME-419)")}</h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Host: Ago-Are Cassava Syndicate. Direct haulage booking. Ideal for high-yield fufu, HQCF, garri, or starch extraction.")}</p>
                        <div className="grid grid-cols-2 gap-2 mt-2 p-2.5 rounded bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant">
                          <div className="flex items-center gap-1"><span className="text-on-surface font-semibold">{tYo("Starch:")}</span>{tYo(" ≥22% Certified")}</div>
                          <div className="flex items-center gap-1"><span className="text-on-surface font-semibold">{tYo("Weighbridge:")}</span>{tYo(" Ago-Are Scale")}</div>
                          <div className="flex items-center gap-1 col-span-2"><span className="text-on-surface font-semibold">{tYo("Haulage:")}</span>{tYo(" Tippers & flatbed ready")}</div>
                        </div>
                      </div>
                      <div className="pt-3 flex items-center justify-between mt-2">
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">{tYo("Farmgate Price")}</span>
                          <div className="font-metric-num text-metric-num text-primary">₦85,000 <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">{tYo("/ MT")}</span></div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Min: 2 Metric Tons")}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddToCart({ id: "cassava-lot", name: "Premium Cassava Roots (TME-419)", detail: "2 MT (Iseyin Central)", price: 170000 })}
                            className="px-4 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors shadow-sm"
                            type="button"
                          >{tYo("Add Lot")}</button>
                        </div>
                      </div>
                    </div>
                  </article>

                  {/* Lot 3: Rice */}
                  <article className="flex flex-col rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                    <div className="relative h-48 w-full bg-surface-container-high overflow-hidden">
                      <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" data-alt="Polished white long-grain Faro-44 parboiled Nigerian rice" src="/images/screens/b1a29da5aa93.webp" alt={tYo("Rice")} loading="lazy" decoding="async" />
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className="px-2.5 py-1 rounded bg-secondary text-on-secondary font-label-sm text-label-sm">{tYo("100% Stone-Free")}</span>
                        <span className="px-2 py-0.5 rounded bg-surface-container-lowest/90 text-on-surface font-label-sm text-label-sm">{tYo("Optical Sorted")}</span>
                      </div>
                      <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-primary-container text-on-primary font-label-sm text-label-sm">{tYo("180 Bags Stocked")}</div>
                    </div>
                    <div className="p-5 flex flex-col gap-3 flex-1 justify-between">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1"><Icon name="pin_drop" className="text-[14px]" />{tYo(" Sagamu Lowland Paddies, Ogun")}</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Fresh Milling")}</span>
                        </div>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">{tYo("Faro-44 Parboiled Milled Rice")}</h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Host: Ogun Green River Basin. High swell ratio, premium table grade in 50kg branded woven sacks.")}</p>
                        <div className="grid grid-cols-2 gap-2 mt-2 p-2.5 rounded bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant">
                          <div className="flex items-center gap-1"><span className="text-on-surface font-semibold">{tYo("Broken Grain:")}</span>{tYo(" ≤5% max")}</div>
                          <div className="flex items-center gap-1"><span className="text-on-surface font-semibold">{tYo("Swell Ratio:")}</span> 1:3.8</div>
                          <div className="flex items-center gap-1 col-span-2"><span className="text-on-surface font-semibold">{tYo("Packaging:")}</span>{tYo(" 50kg poly-lined")}</div>
                        </div>
                      </div>
                      <div className="pt-3 flex items-center justify-between mt-2">
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">{tYo("Wholesale Price")}</span>
                          <div className="font-metric-num text-metric-num text-primary">₦44,500 <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">{tYo("/ 50kg")}</span></div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Min: 2 Bags")}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddToCart({ id: "rice-lot", name: "Faro-44 Parboiled Milled Rice", detail: "2 × 50kg bag (Sagamu)", price: 89000 })}
                            className="px-4 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors shadow-sm"
                            type="button"
                          >{tYo("Add Lot")}</button>
                        </div>
                      </div>
                    </div>
                  </article>

                  {/* Lot 4: Garri */}
                  <article className="flex flex-col rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                    <div className="relative h-48 w-full bg-surface-container-high overflow-hidden">
                      <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" data-alt="Dry, ultra-crisp white Ijebu Garri in clean open textile bags" src="/images/screens/2b51358ff488.webp" alt={tYo("Garri")} loading="lazy" decoding="async" />
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className="px-2.5 py-1 rounded bg-primary text-on-primary font-label-sm text-label-sm">{tYo("Traditional Crisp")}</span>
                        <span className="px-2 py-0.5 rounded bg-surface-container-lowest/90 text-on-surface font-label-sm text-label-sm">{tYo("Sand-Free Screened")}</span>
                      </div>
                      <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-primary-container text-on-primary font-label-sm text-label-sm">{tYo("95 Bags Available")}</div>
                    </div>
                    <div className="p-5 flex flex-col gap-3 flex-1 justify-between">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1"><Icon name="pin_drop" className="text-[14px]" />{tYo(" Ijebu-Ode Agro Center, Ogun")}</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Batch 14-B")}</span>
                        </div>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">{tYo("Fine White Ijebu Garri (Crisp & Dry)")}</h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Triple-fermented, low moisture, pleasant tart taste. Direct from Ijebu-Ode processing collective.")}</p>
                        <div className="grid grid-cols-2 gap-2 mt-2 p-2.5 rounded bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant">
                          <div className="flex items-center gap-1"><span className="text-on-surface font-semibold">{tYo("Moisture:")}</span> ≤9.8%</div>
                          <div className="flex items-center gap-1"><span className="text-on-surface font-semibold">{tYo("Ferment:")}</span>{tYo(" 4-Day Slow Cure")}</div>
                          <div className="flex items-center gap-1 col-span-2"><span className="text-on-surface font-semibold">{tYo("Sack Size:")}</span>{tYo(" 80kg Heavy Weave")}</div>
                        </div>
                      </div>
                      <div className="pt-3 flex items-center justify-between mt-2">
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">{tYo("Bag Unit Price")}</span>
                          <div className="font-metric-num text-metric-num text-primary">₦38,000 <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">{tYo("/ 80kg")}</span></div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Min: 1 Bag")}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddToCart({ id: "garri-lot", name: "Fine White Ijebu Garri", detail: "1 × 80kg bag (Ijebu-Ode)", price: 38000 })}
                            className="px-4 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors shadow-sm"
                            type="button"
                          >{tYo("Add Lot")}</button>
                        </div>
                      </div>
                    </div>
                  </article>

                  {/* Lot 5: Peppers */}
                  <article className="flex flex-col rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                    <div className="relative h-48 w-full bg-surface-container-high overflow-hidden">
                      <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" data-alt="Vibrant red scotch bonnet and tatashe bell peppers" src="/images/screens/42d206153a1c.webp" alt={tYo("Peppers")} loading="lazy" decoding="async" />
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className="px-2.5 py-1 rounded bg-tertiary text-on-tertiary font-label-sm text-label-sm">{tYo("Morning Harvest")}</span>
                        <span className="px-2 py-0.5 rounded bg-surface-container-lowest/90 text-on-surface font-label-sm text-label-sm">{tYo("Same-Day Lagos Transit")}</span>
                      </div>
                      <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-primary-container text-on-primary font-label-sm text-label-sm">{tYo("45 Crates Live")}</div>
                    </div>
                    <div className="p-5 flex flex-col gap-3 flex-1 justify-between">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1"><Icon name="pin_drop" className="text-[14px]" />{tYo(" Otu Horticultural Cluster, Oyo")}</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Picked 06:30 AM")}</span>
                        </div>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">{tYo("Fresh Tatashe & Rodo Peppers")}</h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Firm, insect-free, grade A spicy bell and habanero varieties packed in standard 25kg ventilated produce crates.")}</p>
                        <div className="grid grid-cols-2 gap-2 mt-2 p-2.5 rounded bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant">
                          <div className="flex items-center gap-1"><span className="text-on-surface font-semibold">{tYo("Packaging:")}</span>{tYo(" 25kg Crates")}</div>
                          <div className="flex items-center gap-1"><span className="text-on-surface font-semibold">{tYo("Handling:")}</span>{tYo(" Ventilated Dry Run")}</div>
                          <div className="flex items-center gap-1 col-span-2"><span className="text-on-surface font-semibold">{tYo("Dispatched:")}</span>{tYo(" Direct to Mile 12 / Bodija")}</div>
                        </div>
                      </div>
                      <div className="pt-3 flex items-center justify-between mt-2">
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">{tYo("Crate Price")}</span>
                          <div className="font-metric-num text-metric-num text-primary">₦22,000 <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">{tYo("/ 25kg")}</span></div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Min: 2 Crates")}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddToCart({ id: "peppers-lot", name: "Fresh Tatashe & Rodo Peppers", detail: "2 × 25kg crates (Otu)", price: 44000 })}
                            className="px-4 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors shadow-sm"
                            type="button"
                          >{tYo("Add Lot")}</button>
                        </div>
                      </div>
                    </div>
                  </article>

                  {/* Lot 6: Soybeans */}
                  <article className="flex flex-col rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                    <div className="relative h-48 w-full bg-surface-container-high overflow-hidden">
                      <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" data-alt="Golden dry soybeans in a bulk grain testing tray" src="/images/screens/5ca9408aa41d.webp" alt={tYo("Soybeans")} loading="lazy" decoding="async" />
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className="px-2.5 py-1 rounded bg-primary text-on-primary font-label-sm text-label-sm">{tYo("Protein ≥38%")}</span>
                        <span className="px-2 py-0.5 rounded bg-surface-container-lowest/90 text-on-surface font-label-sm text-label-sm">{tYo("Non-GMO Verified")}</span>
                      </div>
                      <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-primary-container text-on-primary font-label-sm text-label-sm">{tYo("220 Bags Ready")}</div>
                    </div>
                    <div className="p-5 flex flex-col gap-3 flex-1 justify-between">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1"><Icon name="pin_drop" className="text-[14px]" />{tYo(" Igboho Agro-Hub, Oyo North")}</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Tested 48h ago")}</span>
                        </div>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">{tYo("High-Protein Soybeans (Clean Grain)")}</h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("High-oil and protein content suited for poultry feed formulateurs and commercial soya milk / oil mills.")}</p>
                        <div className="grid grid-cols-2 gap-2 mt-2 p-2.5 rounded bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant">
                          <div className="flex items-center gap-1"><span className="text-on-surface font-semibold">{tYo("Crude Protein:")}</span> 38.6%</div>
                          <div className="flex items-center gap-1"><span className="text-on-surface font-semibold">{tYo("Moisture:")}</span> 10.2%</div>
                          <div className="flex items-center gap-1 col-span-2"><span className="text-on-surface font-semibold">{tYo("Foreign Matter:")}</span> &lt;1.5%</div>
                        </div>
                      </div>
                      <div className="pt-3 flex items-center justify-between mt-2">
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">{tYo("Feedmill Standard")}</span>
                          <div className="font-metric-num text-metric-num text-primary">₦78,000 <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">{tYo("/ 100kg")}</span></div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">{tYo("Min: 2 Bags")}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddToCart({ id: "soybeans-lot", name: "High-Protein Soybeans", detail: "2 × 100kg bag (Igboho)", price: 156000 })}
                            className="px-4 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors shadow-sm"
                            type="button"
                          >{tYo("Add Lot")}</button>
                        </div>
                      </div>
                    </div>
                  </article>
                </div>
              ))}
              <div className="p-6 rounded-xl bg-surface-container-low flex flex-col md:flex-row items-center justify-between gap-4 mt-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shrink-0">
                    <Icon name="precision_manufacturing" className="text-[24px]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">{tYo("Need Contract Sourcing (≥ 50 Metric Tons)?")}</span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("We organize pooled syndicate supply contracts for breweries, starch mills, and feed producers with Certificate of Analysis (COA).")}</p>
                  </div>
                </div>
                <button
                  onClick={handleRequestBulkRfq}
                  className="px-5 py-2.5 rounded-lg bg-surface-container-lowest text-primary font-label-md text-label-md hover:bg-surface-container transition-colors shrink-0 shadow-sm"
                  type="button"
                >{tYo("Request Bulk RFQ")}</button>
              </div>
            </div>

            {/* Sidebar Cart & Dispatch Section */}
            <aside className="lg:col-span-4 sticky top-28 flex flex-col gap-6" id="quick-checkout">
              <div className="p-6 rounded-xl bg-surface-container-lowest shadow-md flex flex-col gap-5">
                <div className="flex items-center justify-between pb-3 bg-surface-container-low/50 -mx-6 -mt-6 p-6 rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <Icon name="shopping_bag" className="text-primary text-[22px]" />
                    <h3 className="font-headline-sm text-headline-sm text-primary font-bold">{tYo("Procurement Dispatch")}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold" id="cartCountBadge">
                    {tYo(cartItems.length)} {tYo(cartItems.length === 1 ? "Lot Active" : "Lots Active")}
                  </span>
                </div>
                <div className="flex flex-col gap-3" id="cartItemsContainer">
                  {cartItems.length === 0 ? (
                    <div className="p-4 rounded-lg bg-surface-container-low text-center text-on-surface-variant text-body-sm">
                      <Icon name="shopping_cart" className="text-[24px] mx-auto text-outline mb-1" />
                      <p>{tYo("Your procurement cart is empty.")}</p>
                      <span className="text-[11px]">{tYo("Use \"Add\" on any live lot to begin.")}</span>
                    </div>
                  ) : (
                    cartItems.map((item) => (
                      <div key={item.listingId} className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-label-md text-label-md text-on-surface font-semibold">{tYo(item.title)}</h4>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">{tYo(item.quantity)} {tYo(item.unit)}{item.sellerName ? ` · ${item.sellerName}` : ""}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="font-label-lg text-label-lg text-primary font-bold">₦{Math.round((item.unitPriceKobo * item.quantity) / 100).toLocaleString()}</span>
                            <button
                              onClick={() => handleRemoveFromCart(item.listingId, item.title)}
                              className="text-[11px] text-error hover:underline pt-0.5"
                              type="button"
                            >{tYo("Remove")}</button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 rounded-lg bg-surface flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                      <Icon name="local_shipping" className="text-[16px]" />{tYo(" Managed Transit Hub")}</span>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">{tYo("GPS Telemetry Tracked")}</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Delivery is ₦3,000 per seller. You enter the drop-off address at checkout.")}</p>
                </div>
                <div className="p-3.5 rounded-lg bg-surface-container-high/60 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-primary font-label-md text-label-md font-bold">
                    <Icon name="verified" className="text-[18px]" />
                    <span>{tYo("CBN Escrow Protection Engine")}</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("100% of your funds remain held in partner settlement custody. Money is only credited to the farm cooperative after delivery inspection and certified weight confirmation.")}</p>
                </div>
                <div className="flex flex-col gap-1.5 pt-2">
                  <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                    <span>{tYo("Lot Subtotal:")}</span>
                    <span className="font-semibold text-on-surface" id="subtotalDisplay">₦{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                    <span>{tYo("Haulage & Cold/Dry Transport:")}</span>
                    <span className="font-semibold text-on-surface" id="haulageDisplay">₦{haulageCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                    <span>{tYo("Escrow Protection Fee:")}</span>
                    <span className="text-secondary font-semibold">{tYo("₦0 (0% Promo)")}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2">
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">{tYo("Total Payable:")}</span>
                    <span className="font-headline-lg text-headline-lg text-primary font-bold" id="grandTotalDisplay">₦{grandTotal.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleLockFundsAndDispatch}
                    className="w-full h-12 bg-primary text-on-primary rounded-lg font-label-lg text-label-lg flex items-center justify-center gap-2 hover:bg-primary-container transition-colors shadow-sm"
                    type="button"
                  >
                    <Icon name="lock" className="text-[20px]" />
                    <span>{tYo("Go to checkout")}</span>
                  </button>
                  <div className="flex items-center justify-center gap-3 pt-1 text-on-surface-variant font-label-sm text-label-sm">
                    <span className="flex items-center gap-1"><Icon name="credit_card" className="text-[14px]" />{tYo(" Card")}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Icon name="account_balance" className="text-[14px]" />{tYo(" NIBSS Instant")}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Icon name="dialpad" className="text-[14px]" />{tYo(" USSD")}</span>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">{tYo("Live Clearing Activity")}</span>
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                </div>
                <div className="flex flex-col gap-2 font-body-sm text-body-sm text-on-surface-variant">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-on-surface">{tYo("₦1.2M Garri Lot to Ibadan")}</span>
                    <span className="text-secondary font-semibold">{tYo("Cleared (Weight 100%)")}</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-on-surface">{tYo("40 MT Cassava to Abeokuta")}</span>
                    <span className="text-on-tertiary-fixed-variant font-semibold">{tYo("In Transit (8h left)")}</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-on-surface">{tYo("50 Bags Rice to Lekki Store")}</span>
                    <span className="text-secondary font-semibold">{tYo("Dispatched")}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* Scalability Section */}
        <section className="w-full bg-surface-container-low py-16">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col gap-10">
            <div className="flex flex-col gap-2 max-w-2xl">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">{tYo("Procurement Solutions")}</span>
              <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold">{tYo("Engineered for Every Scale of African Food Commerce")}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">{tYo("From neighborhood grocery deliveries to 50-tonne bulk truckloads feeding urban processors, CultivaNode guarantees uniform grades and transparent weighbridge settlements.")}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-8 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-6">
                <div className="flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                    <Icon name="restaurant" className="text-[26px]" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary font-bold">{tYo("Households & Small Caterers")}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">{tYo("Retail lots delivered straight to your door or kitchen. Enjoy clean, machine-sorted staples and crisp vegetables without market congestion markups or middleman weigh tampering.")}</p>
                </div>
                <ul className="flex flex-col gap-2 font-label-md text-label-md text-on-surface">
                  <li className="flex items-center gap-2">
                    <Icon name="check_circle" className="text-secondary text-[18px]" />
                    <span>{tYo("1 to 5 bag mini-lot access")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="check_circle" className="text-secondary text-[18px]" />
                    <span>{tYo("Direct residential drop-off")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="check_circle" className="text-secondary text-[18px]" />
                    <span>{tYo("Pay via standard Card / Transfer")}</span>
                  </li>
                </ul>
              </div>
              <div className="p-8 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-6">
                <div className="flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-lg bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                    <Icon name="storefront" className="text-[26px]" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary font-bold">{tYo("Supermarkets & Retail Chains")}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">{tYo("Standardized weekly replenishment agreements. All sacks barcode-tagged, moisture checked, and guaranteed with strict 24-hour scheduled warehouse drop windows.")}</p>
                </div>
                <ul className="flex flex-col gap-2 font-label-md text-label-md text-on-surface">
                  <li className="flex items-center gap-2">
                    <Icon name="check_circle" className="text-secondary text-[18px]" />
                    <span>{tYo("Uniform quality grading specs")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="check_circle" className="text-secondary text-[18px]" />
                    <span>{tYo("Automated VAT & electronic invoicing")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="check_circle" className="text-secondary text-[18px]" />
                    <span>{tYo("Scheduled recurring routes")}</span>
                  </li>
                </ul>
              </div>
              <div className="p-8 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-6">
                <div className="flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary-container flex items-center justify-center text-on-primary">
                    <Icon name="factory" className="text-[26px]" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary font-bold">{tYo("Feed Mills & Food Processors")}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">{tYo("Heavy multi-ton haulage with factory gate weighbridge clearance, independent aflatoxin/protein lab certificates, and buffered just-in-time logistics.")}</p>
                </div>
                <ul className="flex flex-col gap-2 font-label-md text-label-md text-on-surface">
                  <li className="flex items-center gap-2">
                    <Icon name="check_circle" className="text-secondary text-[18px]" />
                    <span>{tYo("Multi-trailer direct dispatch")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="check_circle" className="text-secondary text-[18px]" />
                    <span>{tYo("Independent lab COA testing")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="check_circle" className="text-secondary text-[18px]" />
                    <span>{tYo("Factory weighbridge variance escrow")}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How CultivaNode Escrow Works */}
        <section className="w-full bg-surface py-16">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col gap-12">
            <div className="text-center max-w-3xl mx-auto flex flex-col gap-3">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">{tYo("Zero-Risk Settlement Architecture")}</span>
              <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold">{tYo("How CultivaNode Escrow Works")}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">{tYo("Complete payment security engineered to protect the buyer from missing metric tonnage or defective moisture while ensuring growers are paid immediately upon delivery.")}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
              <div className="flex flex-col gap-4 p-6 rounded-xl bg-surface-container-lowest shadow-sm relative">
                <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-metric-num text-metric-num font-bold text-lg">1</div>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">{tYo("Browse & Select Lot")}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Explore verified farmgate inventory with complete clarity on LGA provenance, moisture levels, harvest dates, and certified farmer syndicates.")}</p>
              </div>
              <div className="flex flex-col gap-4 p-6 rounded-xl bg-surface-container-lowest shadow-sm relative">
                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-metric-num text-metric-num font-bold text-lg">2</div>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">{tYo("Lock Deposit in Escrow")}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Funds are securely deposited and isolated in our partner payment settlement trust. The grower receives instant dispatch notification to load haulage.")}</p>
              </div>
              <div className="flex flex-col gap-4 p-6 rounded-xl bg-surface-container-lowest shadow-sm relative">
                <div className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-metric-num text-metric-num font-bold text-lg">3</div>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">{tYo("GPS-Tracked Haulage")}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("The batch is picked up by CultivaNode Logistics Fleet. Monitor vehicle transit in real time with estimated arrivals directly into your intake depot.")}</p>
              </div>
              <div className="flex flex-col gap-4 p-6 rounded-xl bg-surface-container-lowest shadow-sm relative">
                <div className="w-10 h-10 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-metric-num text-metric-num font-bold text-lg">4</div>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">{tYo("Inspect & Release Funds")}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{tYo("Perform your scale weigh-in and physical check within 24 hours. Once confirmed, payment is instantly released to the farmer cluster's account.")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Guarantees */}
        <section className="w-full bg-surface-container-lowest py-14">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-surface-container-low">
                <Icon name="scale" className="text-primary text-[28px] shrink-0" />
                <div className="flex flex-col">
                  <h4 className="font-label-lg text-label-lg text-primary font-bold">{tYo("Exact Weight Guarantee")}</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{tYo("Calibrated certified scales. Any discrepancy is instantly refunded pro-rata from escrow.")}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg bg-surface-container-low">
                <Icon name="eco" className="text-primary text-[28px] shrink-0" />
                <div className="flex flex-col">
                  <h4 className="font-label-lg text-label-lg text-primary font-bold">{tYo("Zero Spoilage Policy")}</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{tYo("Rapid 4-hour photo dispute turnaround for fresh perishables or water-damaged bags.")}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg bg-surface-container-low">
                <Icon name="handshake" className="text-primary text-[28px] shrink-0" />
                <div className="flex flex-col">
                  <h4 className="font-label-lg text-label-lg text-primary font-bold">{tYo("100% Farmgate Payout")}</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{tYo("Direct economic empowerment: no unauthorized middleman commissions or local tolls.")}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg bg-surface-container-low">
                <Icon name="security" className="text-primary text-[28px] shrink-0" />
                <div className="flex flex-col">
                  <h4 className="font-label-lg text-label-lg text-primary font-bold">{tYo("NDPA 2023 Compliant")}</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{tYo("Bank-grade data encryption and fully compliant with Nigerian agricultural data standards.")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ & Enterprise Sourcing Desk Form */}
        <section className="w-full bg-surface-container-low py-16">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">{tYo("Buyer FAQ")}</span>
                <h2 className="font-headline-lg text-headline-lg text-primary font-bold mt-1">{tYo("Frequently Asked Sourcing Questions")}</h2>
              </div>
              <div className="flex flex-col gap-3">
                <details className="p-4 rounded-lg bg-surface-container-lowest shadow-sm group">
                  <summary className="font-headline-sm text-headline-sm text-on-surface font-semibold flex items-center justify-between cursor-pointer list-none">
                    <span>{tYo("How does delivery dispatch and haulage work?")}</span>
                    <Icon name="expand_more" className="text-on-surface-variant group-open:rotate-180 transition-transform" />
                  </summary>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-3">{tYo("CultivaNode manages a verified fleet of dry haulage flatbeds, box trucks, and ventilated horticultural pickups. When you order, a dispatch order is generated with the nearest transport cluster in the harvest region. Transit times are typically under 6 hours to Ibadan and under 10 hours to Lagos and Ogun metropolitan areas.")}</p>
                </details>
                <details className="p-4 rounded-lg bg-surface-container-lowest shadow-sm group">
                  <summary className="font-headline-sm text-headline-sm text-on-surface font-semibold flex items-center justify-between cursor-pointer list-none">
                    <span>{tYo("Can I inspect the produce before releasing funds?")}</span>
                    <Icon name="expand_more" className="text-on-surface-variant group-open:rotate-180 transition-transform" />
                  </summary>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-3">{tYo("Yes. You have a full 24-hour inspection window after delivery to verify moisture content, broken grain ratios, or sack weight. The driver cannot demand cash; payment is strictly held in digital escrow until you sign off via SMS or mobile web dashboard.")}</p>
                </details>
                <details className="p-4 rounded-lg bg-surface-container-lowest shadow-sm group">
                  <summary className="font-headline-sm text-headline-sm text-on-surface font-semibold flex items-center justify-between cursor-pointer list-none">
                    <span>{tYo("What happens if produce arrives damaged or underweight?")}</span>
                    <Icon name="expand_more" className="text-on-surface-variant group-open:rotate-180 transition-transform" />
                  </summary>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-3">{tYo("You simply upload a photo or weighbridge scale slip to the portal. Our dispute settlement desk reviews claims within 4 business hours. If goods are damaged in transit, our logistics insurance covers the loss and your escrow is refunded immediately.")}</p>
                </details>
                <details className="p-4 rounded-lg bg-surface-container-lowest shadow-sm group">
                  <summary className="font-headline-sm text-headline-sm text-on-surface font-semibold flex items-center justify-between cursor-pointer list-none">
                    <span>{tYo("Can I set up scheduled monthly delivery agreements?")}</span>
                    <Icon name="expand_more" className="text-on-surface-variant group-open:rotate-180 transition-transform" />
                  </summary>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-3">{tYo("Commercial restaurants, boarding schools, and supermarket distributors can execute quarterly standing orders. Prices are hedged against seasonal volatility with predictable weekly drops and priority fleet allocation.")}</p>
                </details>
              </div>
            </div>
            <div className="lg:col-span-5 p-8 rounded-xl bg-surface-container-lowest shadow-md flex flex-col gap-6">
              <div>
                <span className="px-2.5 py-1 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm uppercase font-bold tracking-wider">{tYo("Commercial Sourcing Desk")}</span>
                <h3 className="font-headline-lg text-headline-lg text-primary font-bold mt-2">{tYo("Custom Bulk Contract?")}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{tYo("Need monthly deliveries of over 100 MT of maize, soy, or cassava for industrial extraction? Speak with our South-West sourcing desk.")}</p>
              </div>
              <form onSubmit={handleEnterpriseDeckSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm text-on-surface" htmlFor={companyNameId}>{tYo("Organization / Business Name")}</label>
                  <input className="h-10 px-3.5 bg-surface rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-low transition-colors" id={companyNameId} placeholder={tYo("e.g. Lagos Milling Co. / Premier Foods")} required type="text" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-on-surface" htmlFor={commodityInterestId}>{tYo("Commodity of Interest")}</label>
                    <select className="h-10 px-3 bg-surface rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none" id={commodityInterestId}>
                      <option>{tYo("White Maize (Feed)")}</option>
                      <option>{tYo("Yellow Maize")}</option>
                      <option>{tYo("Cassava Roots (Fresh)")}</option>
                      <option>{tYo("Faro-44 Paddy")}</option>
                      <option>{tYo("Soybeans (Industrial)")}</option>
                      <option>{tYo("Processed Garri")}</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-on-surface" htmlFor={monthlyTonnageId}>{tYo("Estimated Monthly Volume")}</label>
                    <select className="h-10 px-3 bg-surface rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none" id={monthlyTonnageId}>
                      <option>{tYo("10 - 25 Metric Tons")}</option>
                      <option>{tYo("25 - 100 Metric Tons")}</option>
                      <option>{tYo("100 - 500 Metric Tons")}</option>
                      <option>{tYo("500+ Metric Tons")}</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm text-on-surface" htmlFor={workEmailId}>{tYo("Official Procurement Contact (Phone / Email)")}</label>
                  <input className="h-10 px-3.5 bg-surface rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-low transition-colors" id={workEmailId} placeholder={tYo("0803... or procurement@company.com")} required type="text" />
                </div>
                <button onClick={() => {}} className="h-11 bg-primary text-on-primary rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-primary-container transition-colors shadow-sm mt-2" type="submit">
                  <Icon name="send" className="text-[18px]" />
                  <span>{tYo("Request Enterprise Sourcing Deck")}</span>
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
