// English copy for the plain information pages: about, platform, solutions, resources, whitepaper,
// legal and waitlist. They replace design mock-ups whose copy was not true (bank escrow, regulator
// registrations, partners, people and figures). Say only what the home page says is in the pilot.
// yo-info.ts must have exactly the same keys (TypeScript enforces it). Load with getInfoCopy().
import { brand } from "@cultivanode/shared/brand";

const enInfo = {
  aboutPage: {
    inPilotTitle: "What you can use in the pilot",
    soonTitle: "Coming soon",
  },
  platformPage: {
    title: `What is in ${brand.name}`,
    intro: "One app for the whole season. This is the same list as on our home page.",
    trustTitle: "How we keep hiring safe",
    appsTitle: "On the web and on Android",
    appsBody: "Use the website or the Android app. Both use the same account.",
    appsCta: "Get the Android app",
  },
  solutionsPage: {
    title: "What you can do, by role",
    intro: "Pick the role that fits you. One account can hold more than one role.",
    roles: [
      {
        title: "Farmers",
        body: "Get a season plan for your crops, check a 10-day forecast for your farm, and keep your store and farm books. Ask the farm assistant in English, Pidgin or Yorùbá. Find verified tractors and farm hands near your farm; in the pilot you pay them directly.",
      },
      {
        title: "Machinery owners",
        body: "List your tractor and implements with your own price per hour, day, hectare or job. Farmers near you send job requests, and you accept or decline in the app. In the pilot the farmer pays you directly.",
      },
      {
        title: "Service providers",
        body: "Farm hands, operators, sprayers, mechanics and extension agents: set your services, your rates and how far you can travel, and get job requests from farmers nearby.",
      },
      {
        title: "Buyers and sellers",
        body: "Farms and suppliers in the pilot list produce, seed and farm inputs on the marketplace. Buyers can see the lots that are on sale.",
      },
    ],
    more: "Learn more",
    checksNote: "Everyone who lists equipment or receives payments is checked with their NIN, BVN and bank account.",
  },
  resourcesPage: {
    title: "Guides and help",
    intro: "Practical help for farming in the South-West. We will add more guides here as they are ready.",
    items: [
      {
        title: "Crops and seasons",
        body: "The 15 crops in the pilot, the three seasons and the two farming zones of the South-West.",
        cta: "See crops and seasons",
      },
      {
        title: "Questions and answers",
        body: "How the pilot works, what it costs, how payment works and how we look after your information.",
        cta: "Read the questions",
      },
      {
        title: "Farm assistant",
        body: "Ask farming questions in English, Pidgin or Yorùbá after you sign in. The assistant can be wrong, so check with an extension agent when you are unsure.",
        cta: "Open the farm assistant",
      },
    ],
  },
  techPage: {
    title: `How ${brand.name} is built`,
    intro: "A short, plain description of the technology behind the app.",
    items: [
      {
        title: "Web and Android app",
        body: "You can use the website or the Android app. Both use the same account and the same records.",
      },
      {
        title: "Database",
        body: "Records are kept in a Postgres database run by Supabase. Farm locations are stored as map points with PostGIS, so the app can find providers near your farm.",
      },
      {
        title: "You see only your own farms",
        body: "Row-level security in the database means each account can read and change only its own farms and records. Staff access is limited by role and every staff action on your account is logged.",
      },
      {
        title: "ID numbers are masked",
        body: "When we check a NIN, BVN or bank account, we keep only a masked number, never the full number.",
      },
      {
        title: "Paying for a hire",
        body: "When you hire in the pilot, you pay the provider directly; the platform does not hold that money. Escrow (money held until you confirm the job) is coming once a licensed payment partner is signed.",
      },
      {
        title: "Where data is stored",
        body: "Our database is hosted in the European Union (Ireland) by our cloud provider. The privacy policy explains what we collect and why.",
      },
    ],
    privacyCta: "Read the privacy policy",
  },
  legalPage: {
    title: "Legal documents",
    intro: `The documents that apply when you use ${brand.name} during the pilot.`,
    open: "Read",
    dataTitle: "Your data",
    dataBody:
      "We follow the Nigeria Data Protection Act 2023. We ask for your consent before ID checks, we keep only masked ID numbers, and you can ask to download or delete your data.",
  },
  waitlistExtra: {
    note: "We will contact you by phone or email when the market opens near you. You can already use the farm tools in the pilot.",
    pilotCta: "Join the pilot",
  },
};

export default enInfo;
export type InfoDictionary = typeof enInfo;
