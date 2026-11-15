// English copy for the audience, crops, partners, waitlist and legal pages.
// yo-pages.ts must have exactly the same keys (TypeScript enforces it).
import { brand } from "@cultivanode/shared/brand";

const enPages = {
  howPage: {
    title: `How ${brand.name} works`,
    intro: "One app for everyone on the farm. Pick your role to see the steps.",
    moneyTitle: "How payment works in the pilot",
    moneyIntro: `During the pilot ${brand.name} does not hold or move money for hires. The app keeps a clear record so both sides know what was agreed.`,
    money: [
      { title: "Find", body: "Choose a verified provider near your farm and see their prices." },
      { title: "Agree", body: "Request the job in the app for a date, at the listed price. The provider accepts or declines, and you both get an SMS." },
      { title: "Work is done", body: "The provider does the job. Check-in and photo proof in the app are coming next." },
      { title: "Pay directly", body: "You pay the provider directly, by cash or transfer. Pay only for work that was done." },
      { title: "Both confirm", body: "Both of you mark the job as paid. Ratings are coming soon. Problems? Tell us and our team will help." },
    ],
    moneyNote: "Protected payments, held by a licensed payment partner until you confirm the job, are planned after legal review. We will tell you before they start.",
  },
  farmersPage: {
    badge: "For farmers",
    title: "Farm with a plan, hire with confidence",
    intro: "Know what to do on your farm and when, find help nearby, and see what every planting really earns.",
    benefitsTitle: "What you get",
    benefits: [
      { soon: true, title: "A season plan for each crop", body: "Land preparation to harvest, worked out from your planting date, your zone and the season." },
      { soon: true, title: "Fertiliser and spray amounts", body: "How much to buy and apply for your farm size, based on written standards for your crop, zone and season." },
      { soon: true, title: "Weather for your farm", body: "10-day forecast and warnings for heavy rain, dry spells, heat and strong wind." },
      { soon: true, title: "Your store", body: "Seeds, fertiliser and chemicals in stock, with warnings before you run short or a product expires." },
      { soon: true, title: "Farm books", body: "Costs and sales per planting, so you know your cost per hectare and your profit." },
      { soon: true, title: "Farm assistant", body: "Ask in English, Pidgin or Yorùbá. Photo diagnosis of a sick plant is coming." },
    ],
    stepsTitle: "Getting started",
    helpTitle: "No smartphone? No problem.",
    helpBody: `A ${brand.name} field agent can help register you and your farm, and important alerts come by SMS.`,
  },
  machineryPage: {
    badge: "For machinery owners",
    title: "Keep your equipment working",
    intro: "List your tractor and implements with your prices, and be found by farms near you.",
    findCta: "Need a tractor? Find one near your farm",
    typesTitle: "Equipment you can list",
    types: [
      "Tractor", "Plough", "Harrow", "Planter", "Harvester", "Sprayer", "Ridger", "Tiller",
      "Irrigation equipment", "Transport equipment", "Other equipment",
    ],
    benefitsTitle: "Why list with us",
    benefits: [
      { soon: false, title: "Work near you", body: "Farmers only see you when their farm is inside the distance you are willing to travel." },
      { soon: true, title: "See where demand is", body: "Find out when many farms nearby need the same job in the same week, and plan your route." },
      { soon: false, title: "Clear prices", body: "Set your price per hour, per day, per hectare or per job. No commission during the pilot." },
      { soon: true, title: "Protected payment", body: "Later, the farmer pays before the job and you are paid when it is confirmed. In the pilot the farmer pays you directly." },
    ],
    stepsTitle: "Getting started",
    requirementsTitle: "What you need",
    requirements: [
      "An email address for sign-in (phone sign-in is coming soon)",
      "Your NIN, BVN and a bank account in your name (checked before you can list)",
      "Proof that you own or manage the equipment",
    ],
  },
  providersPage: {
    badge: "For service providers",
    title: "Get farm jobs near you",
    intro: "Farm hands, operators, sprayers, mechanics, agronomists and extension agents: build your name with every job.",
    typesTitle: "Services you can offer",
    types: [
      "Farm hand", "Machine operator", "Mechanic", "Spraying service", "Agronomist", "Extension agent", "Vet", "Agro-processor",
    ],
    benefitsTitle: "Why join",
    benefits: [
      { soon: false, title: "Jobs close to home", body: "Set how far you can travel. Only farms inside that distance can book you." },
      { soon: true, title: "Build your rating", body: "Every completed job can be rated. Good ratings bring more work and, later, a trusted badge." },
      { soon: true, title: "Protected payment", body: "Later, payment is held before you start and released when the job is confirmed. In the pilot the farmer pays you directly." },
    ],
    stepsTitle: "Getting started",
    requirementsTitle: "What you need",
    requirements: [
      "An email address for sign-in (phone sign-in is coming soon)",
      "Your NIN, BVN and a bank account in your name",
      "A certificate or licence where your service needs one (for example spraying or vet work)",
    ],
  },
  cropsPage: {
    title: "Crops and seasons",
    intro: `${brand.name} starts with 15 crops grown across the South-West, for both rainy seasons and dry-season vegetables.`,
    listTitle: "Crops at launch",
    seasonsTitle: "Three seasons",
    seasons: [
      { title: "Early rainy season", body: "Main planting from the first steady rains, roughly March to July." },
      { title: "Late rainy season", body: "Second planting from about August to November." },
      { title: "Dry season (irrigated)", body: "Vegetables and other crops grown with irrigation from about November to March." },
    ],
    zonesTitle: "Two farming zones",
    zones: [
      { title: "Rainforest", body: "The humid forest belt: much of Ogun, Ondo, Osun, Ekiti, southern Oyo and Lagos." },
      { title: "Derived savanna", body: "The drier transition belt: northern Oyo, northern Ogun and parts of Osun and Ekiti." },
    ],
    standardsTitle: "Recommendations you can trace",
    standardsBody:
      "Fertiliser and spray amounts (coming soon) will come from a written standard for that crop, zone and season. The app will show which standard it used, so you and your extension agent can check it.",
  },
  partnersPage: {
    title: "Partner with us",
    intro: "We work with organisations that serve farmers. Together we can reach more farms with good advice, fair hiring and better records.",
    typesTitle: "Who we would like to work with",
    types: [
      { title: "Cooperatives and farmer groups", body: "Register members, plan together and book machinery for the group." },
      { title: "Government and ADPs", body: "Extension support, farmer registration and programme delivery." },
      { title: "Research and training institutions", body: "Agronomic standards, crop calendars and training content." },
      { title: "Input and equipment companies", body: "Reliable products and services for farmers in the pilot communities." },
      { title: "Development partners and NGOs", body: "Programmes that reach smallholder farmers." },
    ],
    currentTitle: "Our partners",
    noneYet: "We will list partners here once agreements are signed.",
    ctaTitle: "Interested in working together?",
    ctaBody: "Tell us about your organisation and the farmers you serve.",
    cta: "Contact us",
  },
  waitlistPage: {
    title: "Join the waitlist",
    intro: `Be first to hear when ${brand.name} Market opens for buying and selling produce, seeds and farm inputs.`,
  },
  legal: {
    draftNotice: "Draft for the pilot. This document may change before launch.",
    versionLabel: "Version",
    updatedLabel: "Last updated",
    contactLine: "Questions about this document? Contact us through the contact page.",
    privacy: {
      title: "Privacy policy",
      intro: `How ${brand.name} collects, uses and protects your information, in line with the Nigeria Data Protection Act 2023.`,
      sections: [
        {
          heading: "Who we are",
          body: [
            `${brand.name} is a farm management and hiring platform being piloted in South-West Nigeria. ${brand.name} is run by Excel Palace Global Concept (BN 7455859), a business name registered with the Corporate Affairs Commission. Excel Palace Global Concept is the data controller responsible for your data.`,
          ],
        },
        {
          heading: "What we collect",
          body: [
            "Account details: your email address, name, preferred language, state and LGA, and phone number if you give it.",
            "Farm records: farm locations and boundaries, plots, soil tests, plantings, work done, stock, costs and sales.",
            "Verification: results of NIN, BVN and CAC checks. We keep only masked numbers (for example *******4417), never the full number. For payouts we keep your bank name, account name and the last four digits of the account.",
            "Documents and photos you upload, such as proof of equipment ownership or photos of crops and completed work.",
            "Messages you send us, and basic technical data such as device type and error reports.",
          ],
        },
        {
          heading: "Why we use it",
          body: [
            "To provide the service you signed up for: plans, reminders, weather, records, hiring and payments.",
            "To verify identities and prevent fraud, and to meet legal and payment-partner requirements.",
            "To improve the app and fix problems.",
            "To send you news or offers, only if you agree. You can change your mind at any time.",
          ],
        },
        {
          heading: "Who we share it with",
          body: [
            "Companies that help us run the service, under contract: cloud hosting, SMS delivery, identity verification and, once payments start, licensed payment partners.",
            "The other side of a booking sees only what is needed for the job, such as your name, the farm location and the date.",
            "We never share your farm records with lenders, buyers, investors or partners unless you give clear permission, and you can withdraw that permission at any time.",
            "Authorities, only when the law requires it.",
          ],
        },
        {
          heading: "Where it is stored and for how long",
          body: [
            "Our database is hosted in the European Union (Ireland) by our cloud provider, with safeguards required by Nigerian law for transfers abroad.",
            "We keep your account and farm records while your account is open. Payment and accounting records are kept for as long as the law requires and cannot be deleted before then.",
          ],
        },
        {
          heading: "Your rights",
          body: [
            "You can ask to see, correct, download or delete your information, withdraw consent, or object to how we use it. Contact us and we will reply within the time the law allows.",
            "You can also complain to the Nigeria Data Protection Commission (NDPC).",
          ],
        },
        {
          heading: "Keeping it safe",
          body: [
            "Data is encrypted in transit and at rest. Access is limited by role, every staff action on your account is logged, and identity documents are stored privately.",
          ],
        },
        {
          heading: "Children",
          body: [`${brand.name} accounts are for people aged 18 and over.`],
        },
        {
          heading: "Changes",
          body: ["If we change this policy we will tell you in the app before the change takes effect."],
        },
      ],
    },
    terms: {
      title: "Terms of use",
      intro: `The rules for using ${brand.name} during the pilot.`,
      sections: [
        {
          heading: "About these terms",
          body: [
            `By creating an account you agree to these terms. The service is in a pilot, so features may change.`,
          ],
        },
        {
          heading: "Your account",
          body: [
            "Sign in with your own email address and keep your sign-in details private. Phone sign-in is coming soon. One person or business has one account.",
            "Business staff each use their own login; never share a login.",
            "Give true information. Roles such as machinery owner or service provider are approved only after checks.",
          ],
        },
        {
          heading: "Farm advice",
          body: [
            "Plans (and, once the planner is ready, fertiliser and spray amounts) are based on your crop, zone and season, but every farm is different. Use them as guidance and confirm with an agronomist or extension agent when unsure.",
            "Always follow the product label and safety instructions when using agrochemicals.",
            "The farm assistant can be wrong and is not a professional diagnosis. Photo diagnosis is coming; when it is ready it will show how confident it is.",
          ],
        },
        {
          heading: "Hiring and payments",
          body: [
            `During the pilot ${brand.name} does not collect, hold or pay out money for hires. The farmer pays the provider directly, and both mark the job as paid in the app. ${brand.name} is not a party to that payment.`,
            "There is no commission during the pilot. Any future commission and cancellation fees will be shown before you book or accept a job.",
            "Protected payments through a licensed payment partner are planned after legal review. We will update these terms and tell you before they start.",
          ],
        },
        {
          heading: "Fair use",
          body: [
            "Do not give false information, create fake bookings or reviews, harass other users, or try to get around payments or security.",
            "We may pause or close accounts that break these rules, and will tell you why.",
          ],
        },
        {
          heading: "Our responsibility",
          body: [
            "We work hard to keep the service accurate and available, but we cannot guarantee harvests, weather forecasts or the work of independent providers. Nothing in these terms limits rights you have under Nigerian consumer law.",
          ],
        },
        {
          heading: "Law and contact",
          body: ["These terms are governed by the laws of the Federal Republic of Nigeria."],
        },
      ],
    },
  },
};

export default enPages;
export type PagesDictionary = typeof enPages;
