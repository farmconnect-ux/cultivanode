import type { ApprovedAgrochemical, SprayPlan } from './types';

export const APPROVED_CHEMICALS_REGISTRY: ApprovedAgrochemical[] = [
  {
    id: 'atrazine-500sc',
    brandName: 'Atrazine 500 SC',
    activeIngredient: 'Atrazine',
    category: 'herbicide',
    recommendedRateLitersOrKgPerHa: 3.0,
    sprayVolumeLitersPerHa: 200,
    preHarvestIntervalDays: 60,
    reEntryIntervalHours: 24,
    targetCrops: ['maize', 'sorghum'],
    targetPests: ['annual grasses', 'broadleaf weeds'],
    isBannedInNigeria: false,
  },
  {
    id: 'glyphosate-360sl',
    brandName: 'ForceUp / Roundup 360 SL',
    activeIngredient: 'Glyphosate',
    category: 'herbicide',
    recommendedRateLitersOrKgPerHa: 4.0,
    sprayVolumeLitersPerHa: 200,
    preHarvestIntervalDays: 30,
    reEntryIntervalHours: 48,
    targetCrops: ['land_clearing', 'cassava_directed'],
    targetPests: ['perennial weeds', 'spear grass'],
    isBannedInNigeria: false,
  },
  {
    id: 'mancozeb-80wp',
    brandName: 'Dithane M-45 (Mancozeb 80 WP)',
    activeIngredient: 'Mancozeb',
    category: 'fungicide',
    recommendedRateLitersOrKgPerHa: 2.5,
    sprayVolumeLitersPerHa: 250,
    preHarvestIntervalDays: 7,
    reEntryIntervalHours: 24,
    targetCrops: ['tomato', 'pepper', 'yam'],
    targetPests: ['early blight', 'late blight', 'anthracnose'],
    isBannedInNigeria: false,
  },
  {
    id: 'emamectin-5sg',
    brandName: 'Proclaim / Ampligo (Emamectin benzoate)',
    activeIngredient: 'Emamectin Benzoate',
    category: 'insecticide',
    recommendedRateLitersOrKgPerHa: 0.25, // 250g/ha
    sprayVolumeLitersPerHa: 200,
    preHarvestIntervalDays: 7,
    reEntryIntervalHours: 12,
    targetCrops: ['maize', 'tomato'],
    targetPests: ['fall armyworm', 'tuta absoluta', 'fruit borer'],
    isBannedInNigeria: false,
  },
  {
    id: 'paraquat-dichloride',
    brandName: 'Gramoxone / Paraquat',
    activeIngredient: 'Paraquat Dichloride',
    category: 'herbicide',
    recommendedRateLitersOrKgPerHa: 3.0,
    sprayVolumeLitersPerHa: 200,
    preHarvestIntervalDays: 90,
    reEntryIntervalHours: 72,
    targetCrops: [],
    targetPests: [],
    isBannedInNigeria: true, // BANNED by NAFDAC
  },
];

function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year!, month! - 1, day!));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0]!;
}

/**
 * Plans a spray operation while enforcing chemical safety, knapsack dilution rates,
 * and Pre-Harvest Interval (PHI) compliance.
 */
export function generateSprayPlan(
  chemicalId: string,
  areaHectares: number,
  applicationDate: string, // YYYY-MM-DD
  plannedHarvestDate: string, // YYYY-MM-DD
  knapsackTankLiters = 16
): SprayPlan {
  const chemical = APPROVED_CHEMICALS_REGISTRY.find((c) => c.id === chemicalId);
  if (!chemical) {
    throw new Error(`Chemical not recognized in agrochemicals registry: ${chemicalId}`);
  }

  if (chemical.isBannedInNigeria) {
    throw new Error(`CRITICAL CHEMICAL SAFETY ERROR: ${chemical.brandName} is BANNED from agricultural use in Nigeria.`);
  }

  const earliestSafeHarvestDate = addDays(applicationDate, chemical.preHarvestIntervalDays);
  if (plannedHarvestDate < earliestSafeHarvestDate) {
    throw new Error(
      `PRE-HARVEST INTERVAL VIOLATION: Planned harvest (${plannedHarvestDate}) is before the safe harvest date (${earliestSafeHarvestDate}) following ${chemical.brandName} application. Risk of toxic residue!`
    );
  }

  const totalChemicalRequired = Math.round(chemical.recommendedRateLitersOrKgPerHa * areaHectares * 100) / 100;
  const totalWaterVolumeLiters = Math.round(chemical.sprayVolumeLitersPerHa * areaHectares);
  const knapsackTanksCount = Math.ceil(totalWaterVolumeLiters / knapsackTankLiters);

  // Dose per tank in ml or grams
  const dosePerTank = Math.round(((totalChemicalRequired * 1000) / knapsackTanksCount) * 10) / 10;

  const safetyWarnings: string[] = [
    `Wear full PPE: nitrile gloves, protective eyewear, respirator mask, and rubber boots during mixing and spraying.`,
    `Do not re-enter the treated plot for ${chemical.reEntryIntervalHours} hours (Re-Entry Interval: REI).`,
    `Do not spray during high winds (>15 km/h) or within 4 hours of expected rainfall.`,
    `Rinse knapsack sprayer 3 times away from water sources after completion.`,
  ];

  return {
    productName: chemical.brandName,
    activeIngredient: chemical.activeIngredient,
    areaHectares,
    totalChemicalRequiredLitersOrKg: totalChemicalRequired,
    totalWaterVolumeLiters,
    knapsackTanksCount,
    dosePerTankMlOrGrams: dosePerTank,
    preHarvestIntervalDays: chemical.preHarvestIntervalDays,
    earliestSafeHarvestDate,
    reEntryIntervalHours: chemical.reEntryIntervalHours,
    safetyWarnings,
  };
}
