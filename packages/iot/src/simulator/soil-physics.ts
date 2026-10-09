// =============================================================================
// CultivaNode Farm Intelligence: Soil Water Balance & Physics Simulation
// =============================================================================

export interface SoilProfile {
  soilType: 'sandy_loam' | 'clay_loam' | 'silt_loam';
  fieldCapacityPct: number;    // VWC % at field capacity
  stressThresholdPct: number;  // Refill trigger point
  wiltingPointPct: number;     // Permanent wilting point
  drainageRatePerHour: number; // Rapid gravitational drainage
  baseEtRatePerHour: number;   // Base crop evapotranspiration loss
}

export const SOIL_PROFILES: Record<string, SoilProfile> = {
  sandy_loam: {
    soilType: 'sandy_loam',
    fieldCapacityPct: 26.0,
    stressThresholdPct: 21.0,
    wiltingPointPct: 13.0,
    drainageRatePerHour: 1.5,
    baseEtRatePerHour: 0.18
  },
  clay_loam: {
    soilType: 'clay_loam',
    fieldCapacityPct: 34.0,
    stressThresholdPct: 26.0,
    wiltingPointPct: 18.0,
    drainageRatePerHour: 0.6,
    baseEtRatePerHour: 0.14
  }
};

export class SoilWaterSimulator {
  private currentMoisturePct: number;
  private profile: SoilProfile;

  constructor(profileName: 'sandy_loam' | 'clay_loam' = 'sandy_loam', initialMoisturePct?: number) {
    this.profile = SOIL_PROFILES[profileName] || SOIL_PROFILES.sandy_loam;
    this.currentMoisturePct = initialMoisturePct ?? this.profile.fieldCapacityPct;
  }

  getMoisture(): number {
    return Math.round(this.currentMoisturePct * 10) / 10;
  }

  getProfile(): SoilProfile {
    return this.profile;
  }

  /**
   * Simulates moisture change over elapsed hours given temperature and irrigation
   */
  step(elapsedHours: number, ambientTempC: number, rainfallMm: number = 0, irrigationMm: number = 0): number {
    // 1. Water addition (rain + irrigation)
    const totalWaterAdded = rainfallMm + irrigationMm;
    if (totalWaterAdded > 0) {
      // 1 mm water roughly increases top 30cm root zone by ~0.33% VWC
      this.currentMoisturePct += totalWaterAdded * 0.33;
    }

    // 2. Gravitational drainage if above field capacity
    if (this.currentMoisturePct > this.profile.fieldCapacityPct) {
      const excess = this.currentMoisturePct - this.profile.fieldCapacityPct;
      const drained = Math.min(excess, this.profile.drainageRatePerHour * elapsedHours);
      this.currentMoisturePct -= drained;
    }

    // 3. Crop Evapotranspiration (ET) demand
    // Higher temperatures accelerate soil water depletion
    const tempFactor = Math.max(0.5, ambientTempC / 26.0);
    const etLoss = this.profile.baseEtRatePerHour * tempFactor * elapsedHours;
    this.currentMoisturePct = Math.max(this.profile.wiltingPointPct - 2.0, this.currentMoisturePct - etLoss);

    return this.getMoisture();
  }

  applyIrrigation(liters: number) {
    // Simulate deliberate irrigation event (e.g. drip run)
    this.currentMoisturePct = Math.min(32.0, this.currentMoisturePct + liters * 0.1);
  }
}
