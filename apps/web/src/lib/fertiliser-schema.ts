import { z } from "zod";
import { SUPPORTED_FERTILISER_CROP_IDS } from "@cultivanode/shared";

const TypedPotassiumSchema = z
  .object({
    value: z.number().finite().min(0).max(50_000),
    unit: z.enum(["mg_kg", "ppm", "cmol_kg", "meq_100g"]),
    basis: z.enum(["elemental_K", "K2O"]).optional(),
    extractionMethod: z.string().trim().min(1).max(64).optional(),
  })
  .strict()
  .superRefine((k, ctx) => {
    if ((k.unit === "mg_kg" || k.unit === "ppm") && !k.basis) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["basis"],
        message: 'Explicit potassium nutrient basis ("elemental_K" or "K2O") is required for mg_kg and ppm readings.',
      });
    }
    if ((k.unit === "cmol_kg" || k.unit === "meq_100g") && k.basis && k.basis !== "elemental_K") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["basis"],
        message: `Unit "${k.unit}" represents exchangeable K+ (elemental_K) and cannot use basis "${k.basis}".`,
      });
    }
  });

/**
 * Mandatory laboratory soil input schema (Batch 04.0-H Revision 2).
 * - Rejects legacy untyped `potassiumPpm` without explicit typed `potassium` (unit + basis).
 * - Requires explicit soil provenance, extractionMethod, samplingDepthCm, and testDate.
 * - Note: caller-supplied `provenance: "lab_confirmed"` is not yet independently verified
 *   against an accredited laboratory certificate; this limitation is disclosed by the engine.
 */
export const SoilSchema = z
  .object({
    pH: z.number().finite().min(0).max(14).optional(),
    ph: z.number().finite().min(0).max(14).optional(),
    nitrogenPpm: z.number().finite().min(0).optional(),
    phosphorusPpm: z.number().finite().min(0).max(10_000),
    potassium: TypedPotassiumSchema,
    organicMatterPercent: z.number().finite().min(0).max(100).optional(),
    organicMatterPct: z.number().finite().min(0).max(100).optional(),
    provenance: z.enum(["lab_confirmed", "field_kit", "farmer_reported", "modelled_estimate"]),
    extractionMethod: z.string().trim().min(1).max(64),
    samplingDepthCm: z.number().finite().positive().max(100),
    testDate: z.string().trim().min(1).max(40),
  })
  .strict()
  .refine((soil) => soil.pH !== undefined || soil.ph !== undefined, {
    message: "Soil pH is required.",
  })
  .refine((soil) => soil.organicMatterPercent !== undefined || soil.organicMatterPct !== undefined, {
    message: "Soil organic matter is required.",
  })
  .transform((soil) => ({
    pH: soil.pH ?? soil.ph!,
    phosphorusPpm: soil.phosphorusPpm,
    potassium: soil.potassium,
    organicMatterPercent: soil.organicMatterPercent ?? soil.organicMatterPct!,
    provenance: soil.provenance,
    extractionMethod: soil.extractionMethod,
    samplingDepthCm: soil.samplingDepthCm,
    testDate: soil.testDate,
  }));

/**
 * Public Fertiliser API request schema (Batch 04.0-H Revision 2).
 * `.strict()` guarantees callers cannot pass `requireStrictSoilProvenance: false` or any other bypass flag.
 */
export const FertiliserSchema = z
  .object({
    cropId: z.enum(SUPPORTED_FERTILISER_CROP_IDS),
    targetYieldTonnesPerHa: z.number().finite().positive().max(100),
    farmAreaHectares: z.number().finite().positive().max(100_000),
    soil: SoilSchema,
    zone: z.string().trim().min(1).max(64),
    growthStage: z.string().trim().min(1).max(64),
    farmId: z.string().trim().min(1).max(64).optional(),
    plotId: z.string().trim().min(1).max(64).optional(),
    requestId: z.string().trim().min(1).max(64).optional(),
  })
  .strict();
