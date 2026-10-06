export interface SoilNutrientProfile {
  pH: number;
  nitrogenPercent?: number; // Organic matter / total N % (e.g. 0.15%)
  phosphorusPpm: number; // Available P (Bray-1, e.g. 8 ppm)
  potassiumPpm: number; // Exchangeable K (e.g. 120 ppm)
  organicMatterPercent?: number;
}

export interface FertiliserRecommendation {
  cropId: string;
  targetYieldTonnesPerHa: number;
  farmAreaHectares: number;
  deficitKgPerHa: {
    nitrogenKg: number;
    phosphorusKg: number;
    potassiumKg: number;
  };
  productApplications: {
    productName: string; // e.g. 'NPK 15:15:15', 'Urea 46%'
    kgPerHa: number;
    totalKg: number;
    fiftyKgBags: number;
    timing: 'basal_planting' | 'top_dress_vegetative' | 'split';
  }[];
  limeRecommendationKgPerHa: number;
  warning?: string;
}

export interface ApprovedAgrochemical {
  id: string;
  brandName: string;
  activeIngredient: string;
  category: 'herbicide' | 'insecticide' | 'fungicide';
  recommendedRateLitersOrKgPerHa: number;
  sprayVolumeLitersPerHa: number;
  preHarvestIntervalDays: number; // PHI
  reEntryIntervalHours: number; // REI
  targetCrops: string[];
  targetPests: string[];
  isBannedInNigeria: boolean;
}

export interface SprayPlan {
  productName: string;
  activeIngredient: string;
  areaHectares: number;
  totalChemicalRequiredLitersOrKg: number;
  totalWaterVolumeLiters: number;
  knapsackTanksCount: number; // assuming standard 16L knapsack
  dosePerTankMlOrGrams: number;
  preHarvestIntervalDays: number;
  earliestSafeHarvestDate: string; // YYYY-MM-DD
  reEntryIntervalHours: number;
  safetyWarnings: string[];
}

export interface WeatherDayForecast {
  date: string; // YYYY-MM-DD
  tempMaxC: number;
  tempMinC: number;
  rainMm: number;
  windSpeedKmh: number;
  humidityPercent: number;
}

export interface CropWeatherAlert {
  date: string;
  alertType: 'drought_stress' | 'fertiliser_leaching' | 'lodging_wind' | 'fungal_blight_risk';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  headline: string;
  recommendation: string;
}

export interface InventoryItemLot {
  id: string;
  sku: string;
  name: string;
  category: 'seed' | 'fertiliser' | 'chemical' | 'fuel' | 'tool';
  unit: string; // 'kg', 'liter', 'bag', 'pack'
  quantityOnHand: number;
  costPerUnitKobo: number;
  expiryDate?: string;
}

export interface StockMovement {
  id: string;
  sku: string;
  movementType: 'receive' | 'issue_to_field' | 'damage_writeoff';
  quantity: number;
  unitCostKobo: number;
  plotId?: string;
  notes?: string;
  timestamp: number;
}

export interface FarmGrossMarginReport {
  cropId: string;
  plotId: string;
  areaHectares: number;
  totalYieldKg: number;
  revenueKobo: number;
  directCostsKobo: {
    machineryKobo: number;
    labourKobo: number;
    seedsKobo: number;
    fertiliserKobo: number;
    chemicalsKobo: number;
    otherKobo: number;
  };
  totalDirectCostKobo: number;
  grossMarginKobo: number;
  grossMarginPerHectareKobo: number;
  costOfProductionPerKgKobo: number;
  roiPercentage: number;
}
