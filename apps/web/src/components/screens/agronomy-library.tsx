"use client";

// Ported from the "resources_agronomy_library_cultivanode" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import { showScreenToast, ScreenDialog, ScreenDialogClose } from "@/components/ds/screen-dialog";
import { downloadFile } from "@/lib/download";
import type { ScreenProps } from "./types";

type GuideItem = {
  id: string;
  category: "crop-production" | "machinery" | "soil" | "escrow" | "faq";
  title: string;
  author: string;
  badge: string;
  badgeColor: string;
  description: string;
  statLabel: string;
  statValue: string;
  pages: string;
  image: string;
  alt: string;
  fullContent?: string;
};

const GUIDES: GuideItem[] = [
  {
    id: "g1",
    category: "crop-production",
    title: "SAMMAZ-15 Hybrid White Maize Production Protocol",
    author: "Engr. B. Ogunlesi (Oyo ADP) · Feb 2025",
    badge: "NCRI Calibrated v2.4",
    badgeColor: "text-primary",
    description: "Optimal spacing (75cm x 25cm, 53,333 plants/Ha), 2-stage split NPK 15-15-15 + Urea top-dressing calendar, and fall armyworm (Spodoptera frugiperda) IPM scouting thresholds.",
    statLabel: "Standard Yield",
    statValue: "4.8–6.2 MT/Ha",
    pages: "37 Pgs",
    image: "/images/screens/6c9b888a0e0d.webp",
    alt: "Maize crops in Oyo state savanna",
    fullContent: "SAMMAZ-15 HYBRID MAIZE PRODUCTION PROTOCOL\nCalibrated for South-West Nigeria Savanna Ecological Zone\n\n1. Land Preparation: Disc plowing followed by harrowing 7-10 days later to break clods.\n2. Plant Population: 53,333 plants/Ha at 75cm between rows and 25cm within row (1 plant/stand).\n3. Basal Fertilizer: 6 bags NPK 15:15:15 at 10-14 DAP band-applied 5cm from stalk.\n4. Top-Dressing: 4 bags Urea 46% at 30-35 DAP side-dressed before rain.\n5. Pest Scouting: Emamectin benzoate at 0.4g/L upon 5% whorl feeding signs.",
  },
  {
    id: "g2",
    category: "crop-production",
    title: "TME-419 Cassava Propagation & Weed Suppression",
    author: "Dr. F. Adeyemi · Jan 2025",
    badge: "IITA Calibrated Standard",
    badgeColor: "text-secondary",
    description: "Mechanical ridge formation vs flat planting, selective pre-emergence herbicide calibration, and optimal 10–12 month harvest timing targeting 28% dry matter industrial starch extraction.",
    statLabel: "Extract Target",
    statValue: "28% Starch",
    pages: "24 Pgs",
    image: "/images/screens/59a5fa59c6f0.webp",
    alt: "Industrial cassava stem cuttings and ridge mounds",
    fullContent: "TME-419 CASSAVA PROPAGATION & WEED SUPPRESSION\nIITA Savanna Standard Protocol\n\n1. Stem Selection: Hardwood stems, 20-25cm long with 5-7 viable nodes.\n2. Ridge Spacing: 1m x 1m ridges (10,000 stands/Ha).\n3. Weed Management: Pre-emergence Atrazine 500 SC within 24h of planting.\n4. Target Harvest: 10-12 months for 28% dry matter starch yield.",
  },
  {
    id: "g3",
    category: "crop-production",
    title: "Tomato & Tatashe Dry Season Drip Irrigation Manual",
    author: "CultivaNode Extension Team · Nov 2024",
    badge: "Horticultural Master Guide",
    badgeColor: "text-tertiary",
    description: "Precision water budgeting in derived savanna, bacterial wilt (Ralstonia) prophylaxis, and foliar calcium nitrate injection protocols during rapid fruit enlargement stages.",
    statLabel: "Daily Budget",
    statValue: "3.5L / Plant",
    pages: "42 Pgs",
    image: "/images/screens/29659391a7a1.webp",
    alt: "Drip irrigation lines watering high-yield crops",
    fullContent: "TOMATO & TATASHE DRY SEASON DRIP IRRIGATION MANUAL\nNIHORT Production Guidelines\n\n1. Drip Line Spacing: 1.2m beds with inline drippers spaced 30cm apart.\n2. Daily Irrigation: 2.5L to 3.5L per plant depending on evapotranspiration.\n3. Fertigation Schedule: Calcium nitrate 5g/plant/week during fruit set.",
  },
  {
    id: "g4",
    category: "machinery",
    title: "Tractor Syndicate Maintenance & Cold-Start Checklist",
    author: "Mechanization Fleet Lead · Jan 2025",
    badge: "Mechanization Fleet Guideline",
    badgeColor: "text-primary",
    description: "Fuel sediment purging, secondary air-cleaner cyclone blowout, three-point hitch hydraulic pressures, and disc plow bearing grease intervals in abrasive tropical ferruginous soils.",
    statLabel: "Grease Interval",
    statValue: "10 Ops Hrs",
    pages: "19 Pgs",
    image: "/images/screens/d31fcf9dbd9f.webp",
    alt: "Heavy agricultural tractor on ferruginous soil",
    fullContent: "TRACTOR SYNDICATE OPERATOR MAINTENANCE CHECKLIST\nMechanization Standards §4.8\n\n1. Daily Pre-Ignition: Engine oil dipstick, coolant level, fuel water-trap drain.\n2. Air Filter: Blow out cyclone dust bowl every 8 operating hours.\n3. Greasing: All 3-point linkage ball joints and disc plow hubs every 10 hours.",
  },
];

const EARLY_SEASON_PHENOLOGY = [
  { crop: "Grain Maize (White)", variety: "SAMMAZ-15 / 16 (Drought Tolerant)", window: "Mar 15 – Apr 10", rate: "20 – 25 kg / Ha", ops: "NPK: 10-14 DAP · Urea: 30 DAP", yield: "4.8 – 6.0 MT/Ha" },
  { crop: "Industrial Cassava", variety: "TME-419 / TMS 0505", window: "Apr 01 – Jun 15", rate: "50–60 Bundles (1m stakes)", ops: "Pre-emergence herbicide 24h post", yield: "25 – 35 MT/Ha" },
  { crop: "Lowland Rice", variety: "FARO-44 (Sipi) / FARO-52", window: "May 01 – Jun 20", rate: "60 – 80 kg (Broadcast/Drill)", ops: "Water leveling + Basal NPK at 14 DAP", yield: "4.0 – 5.5 MT/Ha" },
  { crop: "Soybean", variety: "TGX 1448-2E / TGX 1835-10E", window: "Jun 15 – Jul 10", rate: "50 – 60 kg / Ha", ops: "Rhizobium inoculation + SSP fertilizer", yield: "1.8 – 2.5 MT/Ha" },
  { crop: "Cowpea / Brown Beans", variety: "IT99K-573-1-1 (Early Maturity)", window: "Jul 01 – Jul 25", rate: "25 – 30 kg / Ha", ops: "Pod borer IPM spray at flowering", yield: "1.2 – 1.8 MT/Ha" },
  { crop: "Horticultural Tatashe & Shombo", variety: "Sombo F1 / Local Red Giant", window: "Mar 01 (Nursery) / Apr 15 (Bed)", rate: "300 – 400g nursery seed", ops: "Staking & preventive copper fungicide", yield: "12 – 18 MT/Ha" },
];

const LATE_SEASON_PHENOLOGY = [
  { crop: "Late Season Maize (Yellow)", variety: "SAMMAZ-52 / PVA 26", window: "Aug 15 – Sep 05", rate: "20 – 25 kg / Ha", ops: "Side-placement Urea before second rains", yield: "4.2 – 5.4 MT/Ha" },
  { crop: "Cowpea (Late Flush)", variety: "SAMPEA 14 / IT97K-499-35", window: "Aug 20 – Sep 15", rate: "25 – 30 kg / Ha", ops: "Flower thrips control at 40 DAP", yield: "1.4 – 2.0 MT/Ha" },
  { crop: "Watermelon & Vegetables", variety: "Sugar Baby / Kaolack", window: "Sep 01 – Oct 10", rate: "1.5 – 2.0 kg / Ha", ops: "Drip fertigation + fruit fly trapping", yield: "20 – 30 MT/Ha" },
  { crop: "Cassava Second Planting", variety: "TMS 30572 / TME 419", window: "Aug 10 – Sep 30", rate: "50 Bundles / Ha", ops: "Mound planting before rain tail-off", yield: "22 – 30 MT/Ha" },
];

export function AgronomyLibrary({ lang }: ScreenProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "yo">("en");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [season, setSeason] = useState<"early" | "late">("early");
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    a1: true,
    b1: true,
  });
  const [activeGuide, setActiveGuide] = useState<GuideItem | null>(null);

  const toggleAccordion = (id: string) => {
    setOpenAccordions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredGuides = GUIDES.filter((g) => {
    if (activeCategory !== "all" && g.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q) || g.badge.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const currentPhenology = season === "early" ? EARLY_SEASON_PHENOLOGY : LATE_SEASON_PHENOLOGY;

  const handleDownloadGuide = (g: GuideItem) => {
    downloadFile(g.fullContent || g.description, `${g.title.replace(/\s+/g, "-")}.txt`, "text/plain");
    showScreenToast(`Downloaded technical protocol: ${g.title}`);
  };

  const handleDownloadPhenologySchedule = () => {
    const csvHeader = "Crop & Taxon,Recommended Variety,Planting Window,Seeding Rate / Ha,Critical Operations Window,Expected Yield\n";
    const rows = currentPhenology
      .map((p) => `"${p.crop}","${p.variety}","${p.window}","${p.rate}","${p.ops}","${p.yield}"`)
      .join("\n");
    downloadFile(csvHeader + rows, `CultivaNode-Agro-Ecological-Calendar-${season}.csv`, "text/csv");
    showScreenToast("Exported agro-ecological phenology schedule to CSV.");
  };

  const modalGuideDetails = activeGuide && (
    <div className="flex flex-col gap-4 p-4 max-w-xl max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
          {activeGuide.badge}
        </span>
        <span className="font-label-sm text-label-sm text-on-surface-variant">{activeGuide.pages}</span>
      </div>
      <h3 className="font-headline-md text-headline-md font-bold text-on-surface">{activeGuide.title}</h3>
      <p className="font-label-sm text-label-sm text-secondary font-medium">{activeGuide.author}</p>
      <div className="p-3 bg-surface-container-low rounded-lg font-mono text-body-sm whitespace-pre-line text-on-surface">
        {activeGuide.fullContent || activeGuide.description}
      </div>
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => handleDownloadGuide(activeGuide)}
          type="button"
          className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold flex items-center gap-1.5"
        >
          <Icon name="download" className="text-base" /> Download Full Protocol
        </button>
        <ScreenDialogClose>
          <button onClick={() => {}} type="button" className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md">
            Close
          </button>
        </ScreenDialogClose>
      </div>
    </div>
  );

  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <section className="relative w-full bg-surface-container-low px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl">
          <div className="max-w-7xl mx-auto flex flex-col gap-space-lg">
            <div className="flex flex-wrap items-center justify-between gap-space-sm text-on-surface-variant font-label-sm text-label-sm">
              <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs">
                <Link className="hover:text-primary transition-colors" href={`/${lang}/resources`}>
                  Agro-Registry
                </Link>
                <span className="text-outline">/</span>
                <Link className="hover:text-primary transition-colors" href={`/${lang}/resources`}>
                  Technical Repositories
                </Link>
                <span className="text-outline">/</span>
                <span aria-current="page" className="text-on-surface font-semibold">
                  Agronomy Knowledge Center
                </span>
              </nav>
              <div className="inline-flex items-center gap-space-xs px-space-sm py-1 bg-surface-container-lowest rounded-full shadow-sm text-secondary">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span className="uppercase tracking-wider font-semibold">IITA &amp; NCRI Calibrated Standards</span>
              </div>
            </div>

            <div className="flex flex-col gap-space-sm max-w-4xl">
              <span className="font-label-md text-label-md tracking-wider uppercase text-secondary">
                Agro-Ecological Extension Series · Document 2 §4.13
              </span>
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold tracking-tight">
                {selectedLanguage === "yo"
                  ? "Àwọn Ìwé Ìtọ́sọ́nà Iṣẹ́ Àgbẹ̀, Ètò Àkókò àti Ìmọ̀ Ẹ̀kọ́"
                  : "Agricultural Resources, Field Guides & Operational Knowledge"}
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                Production protocols, phenological calendars, crop protection spray schedules, and official CultivaNode platform guidelines calibrated for South-West Nigeria agro-ecological zones (Oyo, Ogun, Ondo, and Osun).
              </p>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-space-md">
                <div className="relative flex-1">
                  <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/70 rounded-lg font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                    id="resourceSearchInput"
                    placeholder="Search 85+ guides, crop standards, or operational FAQs (e.g., SAMMAZ-15, Escrow, PostGIS)..."
                    type="text"
                  />
                </div>
                <div className="flex items-center gap-space-xs shrink-0 self-start lg:self-auto bg-surface-container-low p-1 rounded-lg">
                  <button
                    onClick={() => {
                      setSelectedLanguage("en");
                      showScreenToast("Library language set to English.");
                    }}
                    className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all font-semibold ${
                      selectedLanguage === "en" ? "bg-primary-container text-on-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                    }`}
                    id="langEnBtn"
                    type="button"
                  >
                    English (Universal)
                  </button>
                  <button
                    onClick={() => {
                      setSelectedLanguage("yo");
                      showScreenToast("Àkójọ ìmọ̀ ti di èdè Yorùbá.");
                    }}
                    className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all font-semibold ${
                      selectedLanguage === "yo" ? "bg-primary-container text-on-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                    }`}
                    id="langYoBtn"
                    type="button"
                  >
                    Èdè Yorùbá
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-space-xs overflow-x-auto pb-1" id="filterPillsContainer">
                {[
                  { key: "all", label: "All Technical Guides (85)" },
                  { key: "crop-production", label: "Crop Production Standards (32)" },
                  { key: "machinery", label: "Tractor & Mechanization (18)" },
                  { key: "soil", label: "Soil & Pedology (12)" },
                  { key: "escrow", label: "Financial & Escrow (11)" },
                  { key: "faq", label: "Platform Operations & NDPA (12)" },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setActiveCategory(item.key)}
                    className={`filter-pill px-space-md py-1.5 rounded-lg font-label-md text-label-md whitespace-nowrap font-semibold transition-colors ${
                      activeCategory === item.key
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                    }`}
                    data-category={item.key}
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Guides Section */}
        <section className="w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl">
          <div className="max-w-7xl mx-auto flex flex-col gap-space-lg">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
              <div>
                <span className="font-label-md text-label-md tracking-wider uppercase text-secondary">Document 2 §4.13 Repository</span>
                <h2 className="font-headline-lg text-headline-lg text-primary">Featured Extension Master Protocols</h2>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">
                Peer-reviewed field standards deployed across Iseyin, Saki, Sagamu, and Akure commercial agronomy clusters.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md" id="featuredGuidesGrid">
              {filteredGuides.map((guide) => (
                <article
                  key={guide.id}
                  className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group"
                  data-category={guide.category}
                >
                  <div className="flex flex-col gap-space-sm">
                    <div className="relative w-full h-40 rounded-lg overflow-hidden bg-surface-container">
                      <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        data-alt={guide.alt}
                        src={guide.image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                      <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full bg-surface-container-lowest font-label-sm text-label-sm font-semibold shadow-sm ${guide.badgeColor}`}>
                        {guide.badge}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-label-sm text-label-sm text-secondary">{guide.author}</span>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold group-hover:text-primary transition-colors">
                        {guide.title}
                      </h3>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-3">{guide.description}</p>
                    <div className="bg-surface-container-low rounded-lg p-2 flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                      <span>
                        {guide.statLabel}: {guide.statValue}
                      </span>
                      <span className="font-semibold text-secondary">{guide.pages}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-xs pt-space-md mt-auto">
                    <ScreenDialog title={guide.title} side="center" panel={modalGuideDetails}>
                      <button
                        onClick={() => setActiveGuide(guide)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-space-sm rounded-lg bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary transition-colors"
                        type="button"
                      >
                        <Icon name="visibility" className="text-[16px]" /> View Guide
                      </button>
                    </ScreenDialog>
                    <button
                      onClick={() => handleDownloadGuide(guide)}
                      className="inline-flex items-center justify-center p-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"
                      title="Download PDF"
                      type="button"
                    >
                      <Icon name="download" className="text-[18px]" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Seasonal Phenology Section */}
        <section className="w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl bg-surface-container-low">
          <div className="max-w-7xl mx-auto flex flex-col gap-space-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
              <div>
                <div className="flex items-center gap-space-xs">
                  <Icon name="calendar_month" className="text-secondary text-[20px]" />
                  <span className="font-label-md text-label-md tracking-wider uppercase text-secondary">Agro-Ecological Telemetry Calendar</span>
                </div>
                <h2 className="font-headline-lg text-headline-lg text-primary">Seasonal Phenology &amp; Seeding Matrix</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Calibrated for derived savanna and rainforest transition zones in Oyo, Ogun, Osun &amp; Ondo.
                </p>
              </div>
              <div className="flex items-center bg-surface-container-lowest p-1 rounded-xl shadow-sm border border-outline-variant/30">
                <button
                  onClick={() => {
                    setSeason("early");
                    showScreenToast("Viewing Early Season (March – July) phenological calendar.");
                  }}
                  className={`px-space-md py-2 rounded-lg font-label-md text-label-md transition-all font-semibold ${
                    season === "early" ? "bg-primary-container text-on-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  id="seasonEarlyBtn"
                  type="button"
                >
                  Early Season (March – July)
                </button>
                <button
                  onClick={() => {
                    setSeason("late");
                    showScreenToast("Viewing Late Season (August – October) phenological calendar.");
                  }}
                  className={`px-space-md py-2 rounded-lg font-label-md text-label-md transition-all font-semibold ${
                    season === "late" ? "bg-primary-container text-on-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  id="seasonLateBtn"
                  type="button"
                >
                  Late Season (August – October)
                </button>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/30">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                      <th className="py-space-sm px-space-md">Crop &amp; Taxon</th>
                      <th className="py-space-sm px-space-md">Recommended Variety</th>
                      <th className="py-space-sm px-space-md">Planting Window</th>
                      <th className="py-space-sm px-space-md">Seeding Rate / Ha</th>
                      <th className="py-space-sm px-space-md">Critical Operations Window</th>
                      <th className="py-space-sm px-space-md text-right">Expected Yield</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-sm text-body-sm divide-y divide-surface-container-low" id="phenologyTableBody">
                    {currentPhenology.map((p, idx) => (
                      <tr key={idx} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-space-md px-space-md font-semibold text-on-surface flex items-center gap-space-xs">
                          <span className="w-2 h-2 rounded-full bg-secondary" /> {p.crop}
                        </td>
                        <td className="py-space-md px-space-md text-on-surface-variant">{p.variety}</td>
                        <td className="py-space-md px-space-md font-semibold text-primary">{p.window}</td>
                        <td className="py-space-md px-space-md text-on-surface-variant">{p.rate}</td>
                        <td className="py-space-md px-space-md">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                            {p.ops}
                          </span>
                        </td>
                        <td className="py-space-md px-space-md text-right font-metric-num font-semibold text-primary">{p.yield}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-space-md bg-surface-container-low flex flex-col md:flex-row items-center justify-between gap-space-sm font-label-sm text-label-sm text-on-surface-variant">
                <div className="flex items-center gap-space-xs">
                  <Icon name="verified" className="text-[16px] text-secondary" />
                  <span>Rainfall distribution telemetry cross-referenced with NIMET 2025 Seasonal Climate Prediction for Oyo, Ogun, Ondo, and Osun.</span>
                </div>
                <button
                  onClick={handleDownloadPhenologySchedule}
                  className="text-primary font-semibold hover:underline flex items-center gap-1"
                  type="button"
                >
                  Download Complete Agro-Ecological Schedule (CSV) <Icon name="arrow_outward" className="text-[14px]" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs Section with Accordions */}
        <section className="w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl">
          <div className="max-w-7xl mx-auto flex flex-col gap-space-xl">
            <div className="flex flex-col gap-space-xs">
              <span className="font-label-md text-label-md tracking-wider uppercase text-secondary">Document 2 §4.15 Inquiries &amp; Protocols</span>
              <h2 className="font-headline-lg text-headline-lg text-primary">Frequently Addressed Field &amp; Platform Inquiries</h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
                Detailed operational resolutions regarding boundary walking, offline sync in remote bushland, Providus escrow settlements, and seed certification verification.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
              {/* Pillar A */}
              <div className="flex flex-col gap-space-md">
                <div className="flex items-center gap-space-xs pb-space-xs border-b border-surface-container-high">
                  <Icon name="polyline" className="text-secondary" />
                  <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">Pillar A: Boundary Delineation &amp; Field Connectivity</h3>
                </div>
                <div className="flex flex-col gap-space-sm" id="accordionGroupA">
                  <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
                    <button
                      onClick={() => toggleAccordion("a1")}
                      className="w-full p-space-md text-left flex items-center justify-between gap-space-sm font-headline-sm text-headline-sm text-on-surface hover:text-primary transition-colors accordion-toggle"
                      type="button"
                    >
                      <span>How does CultivaNode measure farm boundaries without a licensed surveyor?</span>
                      <Icon name="expand_more" className={`text-outline transition-transform duration-200 ${openAccordions.a1 ? "rotate-180" : ""}`} />
                    </button>
                    {openAccordions.a1 && (
                      <div className="px-space-md pb-space-md text-on-surface-variant font-body-sm text-body-sm flex flex-col gap-2">
                        <p>
                          CultivaNode utilizes the <strong>PostGIS GeoDjango spatial extension engine</strong>. Extension officers walk the perimeter with mobile GNSS devices utilizing multi-constellation RTK correction where available, generating an enclosed polygon centroid with sub-meter spatial accuracy.
                        </p>
                        <p>
                          To secure community validity in agrarian nodes like Saki and Ibarapa, boundary walks are counter-signed via digital signature or thumbprint by the cluster&apos;s traditional Baale or Land Holding Committee, fully aligned with the Oyo &amp; Ogun Agricultural Land Administration guidelines.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
                    <button
                      onClick={() => toggleAccordion("a2")}
                      className="w-full p-space-md text-left flex items-center justify-between gap-space-sm font-headline-sm text-headline-sm text-on-surface hover:text-primary transition-colors accordion-toggle"
                      type="button"
                    >
                      <span>Do I need internet on my farm to record daily operations?</span>
                      <Icon name="expand_more" className={`text-outline transition-transform duration-200 ${openAccordions.a2 ? "rotate-180" : ""}`} />
                    </button>
                    {openAccordions.a2 && (
                      <div className="px-space-md pb-space-md text-on-surface-variant font-body-sm text-body-sm flex flex-col gap-2">
                        <p>
                          <strong>No.</strong> CultivaNode mobile field units operate on an asynchronous <strong>Local SQLite Queue Architecture</strong>. Spray records, fuel fill logs, yield tallies, and worker attendance can be entered without cellular coverage.
                        </p>
                        <p>
                          Once the supervisor or farmer returns to 2G/3G coverage at a market town, the device automatically synchronizes transactional diffs via encrypted REST payloads with automated conflict resolution.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pillar B */}
              <div className="flex flex-col gap-space-md">
                <div className="flex items-center gap-space-xs pb-space-xs border-b border-surface-container-high">
                  <Icon name="payments" className="text-secondary" />
                  <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">Pillar B: Machinery Escrow &amp; Operator Settlement</h3>
                </div>
                <div className="flex flex-col gap-space-sm" id="accordionGroupB">
                  <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
                    <button
                      onClick={() => toggleAccordion("b1")}
                      className="w-full p-space-md text-left flex items-center justify-between gap-space-sm font-headline-sm text-headline-sm text-on-surface hover:text-primary transition-colors accordion-toggle"
                      type="button"
                    >
                      <span>How does the 0% pilot commission escrow mechanism work?</span>
                      <Icon name="expand_more" className={`text-outline transition-transform duration-200 ${openAccordions.b1 ? "rotate-180" : ""}`} />
                    </button>
                    {openAccordions.b1 && (
                      <div className="px-space-md pb-space-md text-on-surface-variant font-body-sm text-body-sm flex flex-col gap-2">
                        <p>
                          When you book tractor plowing or harrowing, 100% of the calculated cost is deposited into an institutional escrow vault hosted at <strong>Providus Bank PLC</strong> under CBN oversight. The tractor operator receives a mobilization token guaranteeing payment upon successful delivery.
                        </p>
                        <p>
                          Upon work completion, the farmer inspects the hectares and enters their PIN, or the system auto-settles after 48 hours in the absence of a dispute. During the current South-West pilot rollout, CultivaNode charges 0% platform intermediary commission.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
                    <button
                      onClick={() => toggleAccordion("b2")}
                      className="w-full p-space-md text-left flex items-center justify-between gap-space-sm font-headline-sm text-headline-sm text-on-surface hover:text-primary transition-colors accordion-toggle"
                      type="button"
                    >
                      <span>What happens if a tractor breaks down midway through plowing?</span>
                      <Icon name="expand_more" className={`text-outline transition-transform duration-200 ${openAccordions.b2 ? "rotate-180" : ""}`} />
                    </button>
                    {openAccordions.b2 && (
                      <div className="px-space-md pb-space-md text-on-surface-variant font-body-sm text-body-sm flex flex-col gap-2">
                        <p>
                          CultivaNode calculates the exact completed acreage utilizing the tractor operator&apos;s onboard GPS telemetry or phone polygon tracker. The completed fraction is logged.
                        </p>
                        <p>
                          The system then offers two immediate escrow remedies: (1) Relief tractor dispatch from the nearest Syndicate cluster within 24 hours, or (2) Instant pro-rata escrow balance refund credited back to the farmer&apos;s mobile wallet or bank account.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pillar C */}
              <div className="flex flex-col gap-space-md">
                <div className="flex items-center gap-space-xs pb-space-xs border-b border-surface-container-high">
                  <Icon name="verified_user" className="text-secondary" />
                  <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">Pillar C: Quality Verification &amp; Seed Integrity</h3>
                </div>
                <div className="flex flex-col gap-space-sm" id="accordionGroupC">
                  <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
                    <button
                      onClick={() => toggleAccordion("c1")}
                      className="w-full p-space-md text-left flex items-center justify-between gap-space-sm font-headline-sm text-headline-sm text-on-surface hover:text-primary transition-colors accordion-toggle"
                      type="button"
                    >
                      <span>How are certified seeds differentiated from counterfeit grain?</span>
                      <Icon name="expand_more" className={`text-outline transition-transform duration-200 ${openAccordions.c1 ? "rotate-180" : ""}`} />
                    </button>
                    {openAccordions.c1 && (
                      <div className="px-space-md pb-space-md text-on-surface-variant font-body-sm text-body-sm flex flex-col gap-2">
                        <p>
                          All inputs cataloged on CultivaNode are authenticated with the <strong>National Agricultural Seeds Council (NASC) SEEDCODEX verification tags</strong>. Each bag features a tamper-proof scratch-off QR code verified directly against the NASC national database.
                        </p>
                        <p>
                          Furthermore, agro-dealers listed on our directory are physically audited and verified by IITA/NCRI accredited field officers across Ibadan, Abeokuta, and Akure.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pillar D */}
              <div className="flex flex-col gap-space-md">
                <div className="flex items-center gap-space-xs pb-space-xs border-b border-surface-container-high">
                  <Icon name="gavel" className="text-secondary" />
                  <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">Pillar D: Statutory Compliance &amp; NDPA 2023</h3>
                </div>
                <div className="flex flex-col gap-space-sm" id="accordionGroupD">
                  <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
                    <button
                      onClick={() => toggleAccordion("d1")}
                      className="w-full p-space-md text-left flex items-center justify-between gap-space-sm font-headline-sm text-headline-sm text-on-surface hover:text-primary transition-colors accordion-toggle"
                      type="button"
                    >
                      <span>Can commercial banks or tax authorities view my yield records?</span>
                      <Icon name="expand_more" className={`text-outline transition-transform duration-200 ${openAccordions.d1 ? "rotate-180" : ""}`} />
                    </button>
                    {openAccordions.d1 && (
                      <div className="px-space-md pb-space-md text-on-surface-variant font-body-sm text-body-sm flex flex-col gap-2">
                        <p>
                          <strong>Absolutely not without your explicit, auditable opt-in consent.</strong> CultivaNode operates strictly under the <strong>Nigeria Data Protection Act (NDPA 2023)</strong> and NITDA statutory guidelines.
                        </p>
                        <p>
                          Your farm telemetry, financial volumes, and harvest yields are encrypted. When applying for agricultural credit, you explicitly generate a revocable 30-day &quot;Lender Token&quot; that shares only the specific data fields required for credit scoring.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Manuals & Printables Section */}
        <section className="w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl bg-surface-container-low">
          <div className="max-w-7xl mx-auto flex flex-col gap-space-lg">
            <div>
              <span className="font-label-md text-label-md tracking-wider uppercase text-secondary">Offline Extension Toolkits</span>
              <h2 className="font-headline-lg text-headline-lg text-primary">Official Field Operational Manuals &amp; Printables</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between">
                <div className="flex flex-col gap-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="menu_book" className="text-[28px]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">PDF Document · 68 Pages · 14.2 MB</span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      Pilot Farm Operations Handbook (Oyo &amp; Ogun Edition)
                    </h3>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Comprehensive reference guide covering cooperative formation, cluster delineation standards, dispute management protocols, and multi-crop spraying schedules.
                  </p>
                </div>
                <div className="pt-space-md mt-auto">
                  <button
                    onClick={() => {
                      downloadFile(
                        "CULTIVANODE PILOT FARM OPERATIONS HANDBOOK (OYO & OGUN EDITION)\nDocument 2 §4.13 Extension Release\n\nChapter 1: Cooperative Delineation & Agrarian Governance\nChapter 2: Mechanization Booking & Escrow Protection\nChapter 3: Agrochemical Safety and Standard Application Rates\nChapter 4: Offline SQLite Synchronization and PowerSync Mesh\n",
                        "CultivaNode-Pilot-Farm-Operations-Handbook.txt",
                        "text/plain"
                      );
                      showScreenToast("Pilot Farm Operations Handbook downloaded.");
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-space-md rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold hover:bg-primary transition-colors"
                    type="button"
                  >
                    <Icon name="download" className="text-[18px]" /> Download Master Handbook
                  </button>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between">
                <div className="flex flex-col gap-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="file_open" className="text-[28px]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">Wall Poster PDF · High-Res Print · 8.4 MB</span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      South-West Agrochemical Safety &amp; Waiting Times Chart
                    </h3>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Laminated field-office poster detailing active ingredient safety classes, PPE standards, and Pre-Harvest Intervals (PHI) for common pesticides and fungicides.
                  </p>
                </div>
                <div className="pt-space-md mt-auto">
                  <button
                    onClick={() => {
                      downloadFile(
                        "SOUTH-WEST AGROCHEMICAL SAFETY & WAITING TIMES CHART\nNAFDAC & WHO Toxicity Classification Guide\n\n1. Mancozeb 80 WP: Class III (Caution) - PHI: 7 Days - PPE: Gloves & Face Mask\n2. Emamectin Benzoate: Class II (Warning) - PHI: 14 Days - PPE: Respirator Level 3\n3. Atrazine 500 SC: Class III (Caution) - Pre-emergence Only - REI: 48 Hours\n4. Lambda-cyhalothrin: Class II (Warning) - PHI: 21 Days - Spray at dusk\n",
                        "South-West-Agrochemical-Safety-Chart.txt",
                        "text/plain"
                      );
                      showScreenToast("Agrochemical safety poster downloaded.");
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-space-md rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold hover:bg-primary transition-colors"
                    type="button"
                  >
                    <Icon name="download" className="text-[18px]" /> Download Wall Poster
                  </button>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between">
                <div className="flex flex-col gap-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="agriculture" className="text-[28px]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">Printable Template (A4) · 2.1 MB</span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      Tractor Syndicate Operator Daily Logbook
                    </h3>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Field-ready daily log sheets for equipment operators: recording hour-meter reads, diesel consumption, implement wear, hectare counters, and farm manager sign-offs.
                  </p>
                </div>
                <div className="pt-space-md mt-auto">
                  <button
                    onClick={() => {
                      downloadFile(
                        "TRACTOR SYNDICATE OPERATOR DAILY LOGBOOK TEMPLATE\nDate: ____________  Cluster: ____________  Tractor Reg: ____________\nOperator Name: ____________  NIN: ____________\n\nMorning Hour-Meter: ______  Evening Hour-Meter: ______\nDiesel Filled (Litres): ______  Hectares Completed: ______\nOperation Type: [ ] Plowing  [ ] Harrowing  [ ] Ridging  [ ] Slashing\nFarmer Supervisor PIN: ______  Signature: ____________\n",
                        "Tractor-Operator-Daily-Logbook-Template.txt",
                        "text/plain"
                      );
                      showScreenToast("Tractor operator logbook template downloaded.");
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-space-md rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold hover:bg-primary transition-colors"
                    type="button"
                  >
                    <Icon name="download" className="text-[18px]" /> Download Operator Logbook
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Support CTA */}
        <section className="w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl">
          <div className="max-w-7xl mx-auto rounded-2xl bg-primary text-on-primary p-space-lg md:p-space-xl relative overflow-hidden shadow-lg">
            <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-secondary/10 pointer-events-none blur-2xl" />
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-lg">
              <div className="flex flex-col gap-space-xs max-w-2xl">
                <div className="inline-flex items-center gap-space-xs text-secondary-container font-label-sm text-label-sm uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" /> Live Agronomy Desk &amp; Field Support
                </div>
                <h2 className="font-headline-lg text-headline-lg font-bold text-on-primary">
                  Have an unidentified crop symptom or need an on-farm extension consultation?
                </h2>
                <p className="font-body-md text-body-md text-on-primary/80">
                  Connect immediately with CultivaNode AI Agronomist, or route your geo-tagged farm photos directly to state ADP extension specialists in Ibadan, Abeokuta, Akure, or Osogbo.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-sm shrink-0 w-full lg:w-auto">
                <Link
                  className="inline-flex items-center justify-center gap-2 py-3 px-space-md rounded-lg bg-secondary-container text-on-secondary-container font-label-md text-label-md font-semibold hover:bg-secondary-fixed transition-colors shadow-sm"
                  href={`/${lang}/account/assistant`}
                >
                  <Icon name="smart_toy" className="text-[20px]" /> Consult AI Farm Assistant
                </Link>
                <a
                  className="inline-flex items-center justify-center gap-2 py-3 px-space-md rounded-lg bg-surface-container-lowest text-primary font-label-md text-label-md font-semibold hover:bg-surface transition-colors shadow-sm"
                  href="https://wa.me/2348000000000"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name="chat" className="text-[20px]" /> ADP WhatsApp Desk
                </a>
                <Link
                  className="inline-flex items-center justify-center gap-2 py-3 px-space-md rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold hover:bg-secondary transition-colors border border-outline-variant/20"
                  href={`/${lang}/contact`}
                >
                  <Icon name="contact_support" className="text-[20px]" /> Submit Query
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
