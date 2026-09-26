// English copy for the audience, crops, partners, waitlist and legal pages.
// yo-pages.ts must have exactly the same keys (TypeScript enforces it).
import { brand } from "@tillmate/shared/brand";

const enPages = {
  howPage: {
    title: `How ${brand.name} works`,
    intro: "One app for everyone on the farm. Pick your role to see the steps.",
    moneyTitle: "How a hire is paid, safely",
    moneyIntro: "When you hire a tractor or a farm hand, your money is protected at every step.",
    money: [
      { title: "Book", body: "Choose a verified provider near your farm and pick a date." },
      { title: "Pay into safe holding", body: "Your payment is held by a licensed payment partner, not paid out straight away." },
      { title: "Work is done", body: "The provider checks in at your farm and uploads photos with location and time." },
      { title: "You confirm", body: "You confirm the job. If you do not reply within 48 hours, payment is released automatically." },
      { title: "Provider is paid", body: "The provider receives their money in their bank account. Problems? Open a dispute and the money stays on hold." },
    ],
    moneyNote: "Payments open after the pilot's payment partner and legal checks are complete.",
  },
  farmersPage: {
    badge: "For farmers",
    title: "Farm with a plan, hire with confidence",
    intro: "Know what to do on your farm and when, find help nearby, and see what every planting really earns.",
    benefitsTitle: "What you get",
    benefits: [
      { title: "A season plan for each crop", body: "Land preparation to harvest, worked out from your planting date, your zone and the season." },
      { title: "Fertiliser and spray amounts", body: "How much to buy and apply for your farm size, from standards reviewed by agronomists." },
      { title: "Weather for your farm", body: "14-day forecast and warnings for heavy rain, dry spells, heat and strong wind." },
      { title: "Your store", body: "Seeds, fertiliser and chemicals in stock, with warnings before you run short or a product expires." },
      { title: "Farm books", body: "Costs and sales per planting, so you know your cost per hectare and your profit." },
      { title: "Farm assistant", body: "Ask in English, Pidgin or Yorùbá, or send a photo of a sick plant." },
    ],
    stepsTitle: "Getting started",
    helpTitle: "No smartphone? No problem.",
    helpBody: `A ${brand.name} field agent can register you and your farm. You confirm with a code sent to your phone, and important alerts come by SMS.`,
  },
  machineryPage: {
    badge: "For machinery owners",
    title: "Keep your equipment working",
    intro: "List your tractor and implements, get bookings from farms near you, and get paid to your bank account.",
    typesTitle: "Equipment you can list",
    types: [
      "Tractor", "Plough", "Harrow", "Planter", "Harvester", "Sprayer", "Ridger", "Tiller",
      "Irrigation equipment", "Transport equipment", "Other equipment",
    ],
    benefitsTitle: "Why list with us",
    benefits: [
      { title: "Work near you", body: "Farmers only see you when their farm is inside the distance you are willing to travel." },
      { title: "See where demand is", body: "Find out when many farms nearby need the same job in the same week, and plan your route." },
      { title: "Clear prices", body: "Set your price per hour, per day or per hectare. The commission comes out of your payment and is shown before you accept." },
      { title: "Payment you can count on", body: "The farmer pays before the job. You are paid after the work is confirmed." },
    ],
    stepsTitle: "Getting started",
    requirementsTitle: "What you need",
    requirements: [
      "A phone number for sign-in",
      "Your NIN, BVN and a bank account in your name (checked before you can list and receive payment)",
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
      { title: "Jobs close to home", body: "Set how far you can travel. Only farms inside that distance can book you." },
      { title: "Build your rating", body: "Every completed, paid job can be rated. Good ratings bring more bookings and a trusted badge." },
      { title: "Get paid safely", body: "Payment is held before you start and released when the job is confirmed." },
    ],
    stepsTitle: "Getting started",
    requirementsTitle: "What you need",
    requirements: [
      "A phone number for sign-in",
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
      "Every plan and fertiliser or spray amount comes from a written standard for that crop, zone and season, reviewed and approved by agronomists. The app shows which standard it used, so you and your extension agent can check it.",
  },
  partnersPage: {
    title: "Partner with us",
    intro: "We work with organisations that serve farmers. Together we can reach more farms with good advice, fair hiring and better records.",
    typesTitle: "Who we work with",
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
    draftNotice: "Draft for the pilot. This document is being reviewed by our lawyers and may change before launch.",
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
            `${brand.name} is a farm management and hiring platform being piloted in South-West Nigeria. "${brand.name}" is a working name. The company responsible for your data (the data controller) will be named here before launch.`,
          ],
        },
        {
          heading: "What we collect",
          body: [
            "Account details: your phone number, name, preferred language, state and LGA, and email if you give it.",
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
            "Companies that help us run the service, under contract: cloud hosting, SMS delivery, identity verification and licensed payment partners.",
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
            `By creating an account you agree to these terms. ${brand.name} is a working name and the service is in a pilot, so features may change.`,
          ],
        },
        {
          heading: "Your account",
          body: [
            "Sign in with your own phone number and keep your one-time codes private. One person or business has one account.",
            "Business staff each use their own login; never share a login.",
            "Give true information. Roles such as machinery owner or service provider are approved only after checks.",
          ],
        },
        {
          heading: "Farm advice",
          body: [
            "Plans and fertiliser or spray amounts come from standards for your crop, zone and season, but every farm is different. Use them as guidance and confirm with an agronomist or extension agent when unsure.",
            "Always follow the product label and safety instructions when using agrochemicals.",
            "The farm assistant can be wrong. Photo diagnoses show how confident they are and are not a professional diagnosis.",
          ],
        },
        {
          heading: "Hiring and payments",
          body: [
            "Payments are handled by a licensed payment partner. Money for a booking is held until the job is confirmed, or released 48 hours after proof of work if the farmer does not respond.",
            "Cancellation fees and our commission are shown before you book or accept a job. The commission is taken from the provider's payment.",
            "Payments are not live during the early pilot. We will tell you before real payments start.",
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
