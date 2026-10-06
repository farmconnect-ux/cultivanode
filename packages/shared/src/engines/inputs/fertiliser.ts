import type { SoilNutrientProfile, FertiliserRecommendation } from './types';

// Nutrient removal per tonne of harvested product (kg N, P2O5, K2O)
const CROP_NUTRIENT_UPTAKE: Record<string, { nPerTonne: number; pPerTonne: number; kPerTonne: number }> = {
  maize: { nPerTonne: 20, pPerTonne: 8, kPerTonne: 16 },
  tomato: { nPerTonne: 3.0, pPerTonne: 1.0, kPerTonne: 4.5 },
  cassava: { nPerTonne: 5.0, pPerTonne: 1.5, kPerTonne: 6.0 },
  yam: { nPerTonne: 4.5, pPerTonne: 1.2, kPerTonne: 5.5 },
  rice: { nPerTonne: 18, pPerTonne: 7, kPerTonne: 22 },
};

/**
 * Deterministically calculates soil nutrient deficits and exact fertiliser applications
 * using standard agronomic extraction formulas for Nigerian agricultural systems.
 */
export function calculateFertiliserRecommendation(
  cropId: string,
  targetYieldTonnesPerHa: number,
  farmAreaHectares: number,
  soil: SoilNutrientProfile
): FertiliserRecommendation {
  const cropReq = CROP_NUTRIENT_UPTAKE[cropId] ?? { nPerTonne: 15, pPerTonne: 6, kPerTonne: 15 };

  // 1. Total nutrient target for desired yield
  const totalNNeeded = cropReq.nPerTonne * targetYieldTonnesPerHa;
  const totalPNeeded = cropReq.pPerTonne * targetYieldTonnesPerHa;
  const totalKNeeded = cropReq.kPerTonne * targetYieldTonnesPerHa;

  // 2. Available soil nutrient credits based on soil testing
  // Soil N credit from organic matter (rough baseline 20 kg/ha if moderate)
  const soilNCredit = (soil.organicMatterPercent ?? 1.5) * 15;
  // Soil P (Bray-1 ppm to kg/ha conversion: roughly ppm * 2 * availability factor 0.3)
  const soilPCredit = soil.phosphorusPpm * 0.6;
  // Soil K (exchangeable ppm to kg/ha: ppm * 1.2 * availability factor 0.4)
  const soilKCredit = soil.potassiumPpm * 0.48;

  // 3. Deficit calculation (clamped to non-negative)
  const nDeficitKgPerHa = Math.max(0, Math.round(totalNNeeded - soilNCredit));
  const pDeficitKgPerHa = Math.max(0, Math.round(totalPNeeded - soilPCredit));
  const kDeficitKgPerHa = Math.max(0, Math.round(totalKNeeded - soilKCredit));

  // 4. Commercial fertilizer formulation for Nigeria:
  // Base recommendation: NPK 15:15:15 to satisfy Phosphorus & Potassium needs
  // NPK 15:15:15 provides 0.15 kg P2O5 per 1 kg of product
  const npkNeededKgPerHa = pDeficitKgPerHa > 0 ? Math.round(pDeficitKgPerHa / 0.15) : 0;
  // Capped at reasonable agronomic maximum (e.g. 400 kg/ha = 8 bags/ha)
  const npkAppliedKgPerHa = Math.min(400, Math.max(npkNeededKgPerHa, 100));

  // N provided by NPK 15:15:15
  const nFromNpk = npkAppliedKgPerHa * 0.15;
  // Remaining N to be supplied by top-dressed Urea (46% N)
  const remainingN = Math.max(0, nDeficitKgPerHa - nFromNpk);
  const ureaAppliedKgPerHa = remainingN > 0 ? Math.round(remainingN / 0.46) : 50;

  // 5. Lime recommendation for acidic soils
  let limeKgPerHa = 0;
  if (soil.pH < 5.0) {
    limeKgPerHa = 1500; // Strong acidity
  } else if (soil.pH < 5.5) {
    limeKgPerHa = 800; // Moderate acidity
  }

  const npkTotalKg = Math.round(npkAppliedKgPerHa * farmAreaHectares);
  const ureaTotalKg = Math.round(ureaAppliedKgPerHa * farmAreaHectares);

  return {
    cropId,
    targetYieldTonnesPerHa,
    farmAreaHectares,
    deficitKgPerHa: {
      nitrogenKg: nDeficitKgPerHa,
      phosphorusKg: pDeficitKgPerHa,
      potassiumKg: kDeficitKgPerHa,
    },
    productApplications: [
      {
        productName: 'NPK 15:15:15',
        kgPerHa: npkAppliedKgPerHa,
        totalKg: npkTotalKg,
        fiftyKgBags: Math.ceil(npkTotalKg / 50),
        timing: 'basal_planting',
      },
      {
        productName: 'Urea (46% N)',
        kgPerHa: ureaAppliedKgPerHa,
        totalKg: ureaTotalKg,
        fiftyKgBags: Math.ceil(ureaTotalKg / 50),
        timing: 'top_dress_vegetative',
      },
    ],
    limeRecommendationKgPerHa: limeKgPerHa,
    warning:
      soil.pH < 5.5
        ? `Soil pH (${soil.pH}) is acidic. Apply agricultural limestone 2-4 weeks before planting to unlock fertiliser efficiency.`
        : undefined,
  };
}
