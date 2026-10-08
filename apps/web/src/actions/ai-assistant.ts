"use server";

import {
  buildGroundedPrompt,
  checkChemicalSafetyGuardrails,
  type FarmerContext,
  type AppLanguage,
  type GroundedKnowledgeSnippet,
} from "@cultivanode/shared";
import { requireAccount } from "@/lib/account/session";

export interface AskAssistantParams {
  query: string;
  context: FarmerContext;
  language?: AppLanguage | "pcm";
}

export interface AssistantResponse {
  answer: string;
  language: AppLanguage | "pcm";
  passedSafetyGuardrail: boolean;
  bannedChemicalsDetected: string[];
  approvedChemicalsDetected: string[];
  safetyAppendices: string[];
  sources: GroundedKnowledgeSnippet[];
}

/**
 * Deterministic agronomic advisor responses grounded in South-West Nigeria GAP standards (IITA & NIHORT).
 */
function generateAgronomicAdvisorAnswer(
  query: string,
  context: FarmerContext,
  lang: AppLanguage | "pcm"
): string {
  const q = query.toLowerCase();

  // 1. Explicit check if user asks about banned chemical directly
  if (q.includes("paraquat") || q.includes("carbofuran") || q.includes("ddt")) {
    return `WARNING: The chemical mentioned (Paraquat / Carbofuran / DDT) is strictly BANNED by NAFDAC across Nigeria due to lethal toxicity and long-term soil hazards. Do not use this substance. For land clearing and weed control in ${context.cropId || "crops"}, use approved glyphosate (for non-crop areas) or mechanical tillage / selective hoe weeding.`;
  }

  // 2. Fall Armyworm (FAW) on Maize
  if ((q.includes("armyworm") || q.includes("kokoro") || q.includes("faw")) && (context.cropId === "maize" || q.includes("maize"))) {
    if (lang === "yo") {
      return `Fun iṣakoso Kokoro Armyworm (Fall Armyworm) lori oko Àgbàdo rẹ:
1. Ṣayẹwo aarin ewe àgbàdo (whorl) ni kutukutu owurọ fun idọti kokoro (frass).
2. Lo oogun ti a fọwọsi gẹgẹbi Emamectin Benzoate (Ampligo / Proclaim) ni iwọn 250g fun hektari kan (tabi 15-20ml ninu knapsack sprayer 16L).
3. Fọ́n oogun naa taara sinu iho aarin ewe (funnel) nibi ti kokoro naa fi pamọ si.
4. Pa ofin NAFDAC mọ: Akoko idaduro ṣaaju ikore (PHI) jẹ ọjọ meje (7 days). Maṣe jẹ ki ẹranko tabi eniyan wọle si oko laarin wakati mejila (12 hours REI).`;
    }
    if (lang === "pcm") {
      return `To stop Fall Armyworm from destroying your Maize:
1. Check inside the maize leaf funnel early morning for their dirt and holes.
2. Spray approved chemical like Emamectin benzoate (Ampligo or Proclaim) with 250g per hectare or 15-20ml inside one 16L knapsack sprayer.
3. Target the spray direct inside the center of the maize leaf where the caterpillar dey hide.
4. Obey NAFDAC rule: Make you wait 7 days before harvest (PHI 7 days), and nobody must enter the farm for 12 hours after spraying (REI 12 hours).`;
    }
    return `To effectively manage Fall Armyworm (Spodoptera frugiperda) on your Maize crop:
1. Scouting: Inspect the leaf whorls (funnels) twice weekly in early morning for sawdust-like frass and windowpane feeding signs.
2. Approved Treatment: Apply Emamectin Benzoate (e.g. Ampligo or Proclaim 5 SG) at 250g/ha (or 15-20ml per 16-litre knapsack).
3. Application Technique: Direct the spray nozzle directly into the central whorl of each maize plant where larvae conceal themselves.
4. Safety & Intervals: Pre-Harvest Interval (PHI) is 7 days. Restricted-Entry Interval (REI) is 12 hours. Always wear full personal protective equipment (PPE).`;
  }

  // 3. Fertiliser questions
  if (q.includes("fertiliser") || q.includes("fertilizer") || q.includes("npk") || q.includes("urea") || q.includes("ajile") || q.includes("iye")) {
    if (lang === "yo") {
      return `Eto Ajilẹ ti o peye fun ${context.cropId ?? "oko rẹ"} ni South-West Nigeria:
1. Ajilẹ Ibẹrẹ (Basal): Lo NPK 15:15:15 (báàgì mẹrin si mẹfa fun hektari kan) lakoko gbigbin tabi ọsẹ meji lẹhin gbigbin.
2. Ajilẹ Ekeji (Top-dressing): Lo Urea (46% N) báàgì meji si mẹta fun hektari kan ni ọsẹ mẹrin si mẹfa (4-6 weeks) nigbati ohun ọgbin ba n ga de ekun.
3. Rii daju pe ilẹ tutu ṣaaju ki o to fi ajilẹ si, ki o si bo o pẹlu iye erupẹ diẹ lati dẹkun pipadanu nitrogen.`;
    }
    if (lang === "pcm") {
      return `Correct Fertiliser guide for your ${context.cropId ?? "farm"} for South-West Nigeria:
1. First Fertiliser (Basal): Put NPK 15:15:15 (around 4 to 6 bags per hectare) during planting or 2 weeks after planting. Put am 5cm away from the crop stem.
2. Second Fertiliser (Top-dressing): Put Urea (46% Nitrogen) 2 to 3 bags per hectare at 4 to 6 weeks when the plant reach knee height.
3. Make sure the soil get small water before you put fertilizer, and cover am small with sand make sun no blow the nitrogen go.`;
    }
    return `Scientifically grounded fertiliser protocol for ${context.cropId ?? "crops"} in South-West Nigeria:
1. Basal Application: Apply NPK 15:15:15 at 200–300 kg/ha (4–6 bags of 50kg per hectare) at planting or 10–14 days after emergence. Place fertiliser 5cm away from seed/stem in a ring or band.
2. Top-Dressing: Side-dress Urea (46% N) at 100–150 kg/ha (2–3 bags/ha) at vegetative knee-high stage (4–6 weeks after planting).
3. Moisture Requirement: Apply fertiliser only on moist soil and lightly incorporate into topsoil to prevent volatile nitrogen losses.`;
  }

  // 4. Weeding and Herbicide
  if (q.includes("weed") || q.includes("koriko") || q.includes("herbicide") || q.includes("clearing")) {
    if (lang === "yo") {
      return `Eto Iṣakoso Koriko fun ${context.cropId ?? "oko rẹ"}:
1. Ṣaaju ki irugbin to hu (Pre-emergence): Lo Atrazine 500 SC (lita 3 fun hektari kan) fun oko àgbàdo lori ilẹ to tutu.
2. Maṣe lo Paraquat rárá - NAFDAC ti fofinde e patapata!
3. Nigbati irugbin ba ti hu: Ṣe itọju koriko pẹlu ọwọ tabi ṣaaju ki koriko to gba agbara lori ohun ọgbin ni ọsẹ 3 si 4 lẹhin gbigbin.`;
    }
    if (lang === "pcm") {
      return `Weed control protocol for your ${context.cropId ?? "crop"}:
1. Before seeds sprout: Spray approved selective herbicide like Atrazine 500 SC (3 litres per hectare) on wet ground.
2. Never use Paraquat at all - NAFDAC don ban am completely for Nigeria!
3. After crops grow: Do manual hoe weeding around 3 to 4 weeks before the weed block sun and fertilizer from your crop.`;
    }
    return `Weed control guidelines for ${context.cropId ?? "crops"} (NAFDAC & IITA compliant):
1. Pre-Emergence: For maize/sorghum, apply Atrazine 500 SC at 3.0 L/ha on damp soil within 48 hours of planting.
2. Safety Warning: Do NOT use Paraquat — it is strictly prohibited and banned by NAFDAC nationwide.
3. Post-Emergence: Perform primary hoe weeding between 21–28 days after planting before canopy closure.`;
  }

  // 5. Livestock Drug Withdrawal & Feed Management
  if (q.includes("withdrawal") || q.includes("antibiotic") || q.includes("oxytet") || (q.includes("livestock") && (q.includes("health") || q.includes("feed") || q.includes("fcr")))) {
    if (lang === "yo") {
      return `Aabo Itọju Ẹran-Ọ̀sìn & Akoko Idaduro (NAFDAC / Veterinary Safety):
1. Akoko Idaduro (Withdrawal Period): Nigbati o ba fun ẹran tabi adìyẹ ni oogun apakokoro (bii Oxytetracycline tabi Penicillin), ẹyin tabi wara wọn kò gbọdọ jẹ tita fun jijẹ titi akoko idaduro yoo fi pari (ọjọ 7 si 14).
2. Ewu Oogun ninu Ounje: Tita eran tabi wara ṣaaju ki akoko idaduro to pari n fa arun ati aibikita oogun (antibiotic resistance) ninu eniyan.
3. Iwọn Ounjẹ (FCR): Bojuto iye ounjẹ ti ẹran jẹ si iye iwuwo ti wọn fi kun lati dinku inawo oko.`;
    }
    if (lang === "pcm") {
      return `Livestock Drug Withdrawal & Feed Safety Guidelines:
1. Withdrawal Period: Once you give your cows, goats, or birds antibiotics like Oxytetracycline, you MUST NOT sell their meat, milk, or eggs until the withdrawal days finish (typically 7 to 14 days depending on medication).
2. Human Health Danger: If people eat meat with active drug residue, e go spoil human health and make future sickness hard to cure.
3. Feed Conversion Ratio (FCR): Measure how many bags of feed your animals chop compare to their weight gain so you no go waste money.`;
    }
    return `Veterinary Drug Withdrawal & Livestock Management Protocol:
1. Food Safety & Withdrawal Period: When administering antibiotics or anthelmintics (e.g. Oxytetracycline, Tylosin), observe the manufacturer and veterinary withdrawal period (typically 7–14 days for meat, 3–5 days for milk/eggs). Products must NOT enter the food supply during this window.
2. Drug Residue Compliance: Violating withdrawal periods leads to consumer antibiotic resistance and rejects from institutional buyers.
3. Feed Conversion Ratio (FCR): For broilers, target an FCR between 1.5–1.8 kg feed per kg live weight. Feed issues should be logged synchronously to update inventory.`;
  }

  // 6. Machinery Maintenance & Fuel Benchmarks
  if (q.includes("machinery") || q.includes("tractor") || q.includes("diesel") || q.includes("fuel") || q.includes("implement") || q.includes("plough")) {
    if (lang === "yo") {
      return `Itọju Ẹrọ Oko & Lilo Epo (Diesel Benchmarks):
1. Lilo Epo: Titulẹ pẹlu tirakito (Plowing) ma n gba lita 12 si 18 fun wakati kan (15–25 L/ha lori ilẹ to le).
2. Itọju Ẹrọ: Ṣe ayẹwo epo ẹrọ (engine oil) ati fẹlẹfẹlẹ afẹfẹ (air filter) ni gbogbo wakati 100 si 250 ti ẹrọ ba ṣiṣẹ.
3. Ifipamọ & Aabo: Maṣe jẹ ki epo doti, ki o si forukọsilẹ wakati iṣẹ ati agbegbe ti a kọja sinu CultivaNode Machinery Fleet Log.`;
    }
    if (lang === "pcm") {
      return `Machinery Fuel & Maintenance Standards:
1. Fuel Usage: Tractor plowing normally dey chop between 12 to 18 litres of diesel per hour (around 15 to 25 L per hectare).
2. Regular Service: Change engine oil and clean air filter every 100 to 250 working hours make tractor no knock.
3. Fleet Records: Always log operator hours and diesel consumed inside your CultivaNode machinery dashboard to detect fuel theft or engine issues early.`;
    }
    return `Mechanization & Fuel Consumption Benchmarks:
1. Fuel Consumption Rates:
   - Primary Tillage (Disc Plowing): 12–18 L/hr (18–25 L/ha depending on soil compaction).
   - Secondary Tillage (Harrowing/Ridging): 8–12 L/hr (10–15 L/ha).
   - Spraying / Boom Sprayers: 4–6 L/hr.
2. Preventive Maintenance: Conduct oil and filter service every 250 operating hours or at seasonal transitions. Inspect hydraulic seals and tyre pressures before heavy field entry.
3. Accountability: Record operator hours and diesel issued directly into the Machinery Fleet tab to automatically track operational costs per hectare.`;
  }

  // 7. Standard-Plan-Actual & Farm Variance
  if (q.includes("variance") || q.includes("plan") || q.includes("benchmark") || q.includes("target") || q.includes("standard")) {
    return `CultivaNode Standard-Plan-Actual Farm Operational Protocol:
1. Advisory Principle: "CultivaNode recommends (agronomic GAP benchmark). The farmer decides (sets planning targets). The farmer records (field actuals). CultivaNode learns from the variance."
2. Variance Tracking: Monitor variances across Yield (bags/ha), Seed rate, Fertiliser quantity, and Mechanization hours.
3. Decision Autonomy: Agronomic standards provide calibrated starting baselines without restricting managerial freedom or land use decisions.`;
  }

  // 5. Default grounded GAP advice
  if (lang === "yo") {
    return `Imọran Ogbin IITA/NIHORT fun ${context.cropId ?? "ohun ogbin rẹ"}:
- Zone: South-West Agro-ecological Zone (${context.zone ?? "Rainforest / Derived Savanna"}).
- Rii daju pe o gbin irugbin ti o ni iwe-ẹri (certified seed/seedlings) lati yago fun arun.
- Tẹle ilana aaye gbigbin ti o peye ki o si ṣe idanwo ilẹ (soil test) lati mọ iye ajilẹ to yẹ.
- Kan si alamọran oko (Field Agent) CultivaNode fun atilẹyin afikun.`;
  }

  if (lang === "pcm") {
    return `Official IITA/NIHORT agricultural advice for your ${context.cropId ?? "crop"}:
- Zone: South-West Agro-ecological Zone (${context.zone ?? "Rainforest / Derived Savanna"}).
- Always buy certified seeds and clean planting materials make disease no enter your farm.
- Follow proper spacing and test your soil so you go know the exact bags of fertilizer wey your farm need.
- Talk to your CultivaNode Field Agent if you need tractor or spraying services.`;
  }

  return `GAP Agronomic Advisory for ${context.cropId ?? "your crop"} in South-West Nigeria:
- Agro-Ecological Suitability: Calibrated for ${context.zone ?? "Rainforest / Derived Savanna"} conditions.
- Certified Planting Material: Use high-yielding, disease-resistant varieties vetted by IITA/NIHORT.
- Timely Operations: Adhere strictly to the operations schedule for land prep, basal fertiliser, and pest scouting.
- Need mechanization? You can directly book tractors, ridgers, or spraying providers through your CultivaNode dashboard.`;
}

export async function askFarmAssistantAction(
  params: AskAssistantParams
): Promise<AssistantResponse> {
  const lang = params.language ?? "en";
  await requireAccount(lang === "yo" ? "yo" : "en");

  const groundedPrompt = buildGroundedPrompt(params.query, params.context, lang);

  // Generate grounded answer
  const rawAnswer = generateAgronomicAdvisorAnswer(params.query, params.context, lang);

  // Run through NAFDAC and agrochemical safety guardrails
  const guardrailResult = checkChemicalSafetyGuardrails(rawAnswer);

  return {
    answer: guardrailResult.sanitizedResponseText,
    language: lang,
    passedSafetyGuardrail: guardrailResult.passed,
    bannedChemicalsDetected: guardrailResult.bannedChemicalsDetected,
    approvedChemicalsDetected: guardrailResult.approvedChemicalsDetected,
    safetyAppendices: guardrailResult.safetyAppendices,
    sources: groundedPrompt.contextSources,
  };
}
