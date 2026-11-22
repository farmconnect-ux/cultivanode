/**
 * CultivaNode Batch 04.0-H — Typed Soil & Fertiliser Nutrient Unit Conversions.
 *
 * Scientific reference constants:
 * - Atomic weight of K (K⁺, valence +1): 39.0983 g/mol
 *   -> 1 cmol(+)/kg = 1 meq/100g = 10 mmol(+)/kg = 390.983 mg/kg (ppm) elemental K.
 *   (Commonly approximated as 391 mg/kg in soil-testing labs.)
 * - Oxide-to-elemental conversion factors (IUPAC atomic weights):
 *   -> K2O / (2 * K) = 94.196 / 78.1966 = 1.204605  (so K2O = K * 1.2046; K = K2O / 1.2046)
 *   -> P2O5 / (2 * P) = 141.9445 / 61.9475 = 2.29137 (so P2O5 = P * 2.2914; P = P2O5 / 2.2914)
 *
 * Safety invariant:
 * Never silently convert an unknown, ambiguous, or incompatible unit or nutrient basis.
 * Always preserve the original laboratory value, unit, and basis alongside derived values.
 */

export const K_MOLAR_MASS_G_PER_MOL = 39.0983;
export const CMOL_KG_TO_MG_KG_K = 390.983; // 1 cmol(+)/kg = 390.983 mg/kg elemental K
export const K_TO_K2O_FACTOR = 1.2046;
export const P_TO_P2O5_FACTOR = 2.2914;

export type SoilPotassiumUnit = 'mg_kg' | 'ppm' | 'cmol_kg' | 'meq_100g';
export type NutrientBasis = 'elemental_K' | 'K2O' | 'elemental_P' | 'P2O5' | 'elemental_N';
export type SoilExtractionMethod =
  | 'bray_1'
  | 'olsen'
  | 'mehlich_3'
  | 'ammonium_acetate_1M'
  | 'kjeldahl'
  | 'walkley_black';

export interface TypedSoilPotassiumInput {
  value: number;
  unit: SoilPotassiumUnit | string;
  basis?: 'elemental_K' | 'K2O' | string;
  extractionMethod?: SoilExtractionMethod | string;
  provenance?: string;
}

export interface ConvertedPotassiumValue {
  ok: true;
  originalValue: number;
  originalUnit: SoilPotassiumUnit;
  originalBasis: 'elemental_K' | 'K2O';
  originalExtractionMethod?: string;
  originalProvenance?: string;
  derivedElementalMgKg: number;
  derivedK2oMgKg: number;
  conversionApplied: boolean;
  conversionFactor: number;
  conversionNote: string;
  /** Explicit separation: mathematical unit conversion is NOT agronomic sufficiency calibration. */
  agronomicInterpretationApplied: false;
}

export interface PotassiumConversionError {
  ok: false;
  code: 'soil_value_invalid' | 'soil_unit_incompatible' | 'soil_basis_unknown';
  message: string;
}

export type PotassiumConversionResult = ConvertedPotassiumValue | PotassiumConversionError;

/**
 * Converts a typed laboratory soil potassium reading into elemental K (mg/kg) and K2O (mg/kg)
 * while preserving original laboratory values and units. Fails closed on ambiguous or invalid inputs.
 */
export function convertSoilPotassium(input: TypedSoilPotassiumInput): PotassiumConversionResult {
  if (typeof input.value !== 'number' || !Number.isFinite(input.value) || input.value < 0 || input.value > 50_000) {
    return {
      ok: false,
      code: 'soil_value_invalid',
      message: 'Soil potassium value must be a finite non-negative number within physical bounds.',
    };
  }

  const unit = input.unit;
  if (unit !== 'mg_kg' && unit !== 'ppm' && unit !== 'cmol_kg' && unit !== 'meq_100g') {
    return {
      ok: false,
      code: 'soil_unit_incompatible',
      message: `Unsupported or ambiguous soil potassium unit "${String(unit)}". Expected mg_kg, ppm, cmol_kg, or meq_100g.`,
    };
  }

  // cmol(+)/kg and meq/100g are charge-equivalent units for exchangeable K+ and CANNOT be K2O oxide basis.
  if (unit === 'cmol_kg' || unit === 'meq_100g') {
    if (input.basis && input.basis !== 'elemental_K') {
      return {
        ok: false,
        code: 'soil_basis_unknown',
        message: `Unit "${unit}" represents exchangeable K+ (elemental_K) and is incompatible with basis "${input.basis}".`,
      };
    }
    const derivedElementalMgKg = Number((input.value * CMOL_KG_TO_MG_KG_K).toFixed(2));
    const derivedK2oMgKg = Number((derivedElementalMgKg * K_TO_K2O_FACTOR).toFixed(2));
    return {
      ok: true,
      originalValue: input.value,
      originalUnit: unit,
      originalBasis: 'elemental_K',
      ...(input.extractionMethod ? { originalExtractionMethod: input.extractionMethod } : {}),
      ...(input.provenance ? { originalProvenance: input.provenance } : {}),
      derivedElementalMgKg,
      derivedK2oMgKg,
      conversionApplied: true,
      conversionFactor: CMOL_KG_TO_MG_KG_K,
      conversionNote: `Converted ${input.value} ${unit} exchangeable K+ to ${derivedElementalMgKg} mg/kg elemental K (× ${CMOL_KG_TO_MG_KG_K}) and ${derivedK2oMgKg} mg/kg K2O equivalent (unit conversion only; not agronomic sufficiency calibration).`,
      agronomicInterpretationApplied: false,
    };
  }

  // mg_kg or ppm: NEVER silently assume elemental_K when basis is omitted (Finding 5).
  if (!input.basis || (input.basis !== 'elemental_K' && input.basis !== 'K2O')) {
    return {
      ok: false,
      code: 'soil_basis_unknown',
      message: `Explicit potassium nutrient basis ("elemental_K" or "K2O") is required for "${unit}" readings; CultivaNode does not silently assume elemental K (received: ${String(input.basis ?? 'undefined')}).`,
    };
  }

  if (input.basis === 'K2O') {
    const derivedElementalMgKg = Number((input.value / K_TO_K2O_FACTOR).toFixed(2));
    const derivedK2oMgKg = Number(input.value.toFixed(2));
    return {
      ok: true,
      originalValue: input.value,
      originalUnit: unit,
      originalBasis: 'K2O',
      ...(input.extractionMethod ? { originalExtractionMethod: input.extractionMethod } : {}),
      ...(input.provenance ? { originalProvenance: input.provenance } : {}),
      derivedElementalMgKg,
      derivedK2oMgKg,
      conversionApplied: true,
      conversionFactor: Number((1 / K_TO_K2O_FACTOR).toFixed(6)),
      conversionNote: `Converted ${input.value} ${unit} K2O to ${derivedElementalMgKg} mg/kg elemental K (÷ ${K_TO_K2O_FACTOR}; unit conversion only; not agronomic sufficiency calibration).`,
      agronomicInterpretationApplied: false,
    };
  }

  const derivedElementalMgKg = Number(input.value.toFixed(2));
  const derivedK2oMgKg = Number((input.value * K_TO_K2O_FACTOR).toFixed(2));
  return {
    ok: true,
    originalValue: input.value,
    originalUnit: unit,
    originalBasis: 'elemental_K',
    ...(input.extractionMethod ? { originalExtractionMethod: input.extractionMethod } : {}),
    ...(input.provenance ? { originalProvenance: input.provenance } : {}),
    derivedElementalMgKg,
    derivedK2oMgKg,
    conversionApplied: false,
    conversionFactor: 1,
    conversionNote: `Preserved ${input.value} ${unit} elemental K (${derivedK2oMgKg} mg/kg K2O equivalent; unit conversion only; not agronomic sufficiency calibration).`,
    agronomicInterpretationApplied: false,
  };
}

export function elementalKToK2O(elementalK: number): number {
  return Number((elementalK * K_TO_K2O_FACTOR).toFixed(2));
}

export function k2OToElementalK(k2o: number): number {
  return Number((k2o / K_TO_K2O_FACTOR).toFixed(2));
}

export function elementalPToP2O5(elementalP: number): number {
  return Number((elementalP * P_TO_P2O5_FACTOR).toFixed(2));
}

export function p2O5ToElementalP(p2o5: number): number {
  return Number((p2o5 / P_TO_P2O5_FACTOR).toFixed(2));
}
