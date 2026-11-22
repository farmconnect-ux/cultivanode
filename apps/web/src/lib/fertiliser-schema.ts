import { z } from "zod";
import { SUPPORTED_FERTILISER_CROP_IDS } from "@cultivanode/shared";

const TypedPotassiumSchema = z
  .object({
    value: z.number().finite().min(0).max(50_000),
    unit: z.enum(["mg_kg", "ppm", "cmol_kg", "meq_100g"]),
    basis: z.enum(["elemental_K", "K2O"]).optional(),
    extractionMethod: z.string().trim().min(1).max(64).optional(),
  })
  .strict();

export const SoilSchema = z
  .object({
    pH: z.number().finite().min(0).max(14).optional(),
    ph: z.number().finite().min(0).max(14).optional(),
    nitrogenPpm: z.number().finite().min(0).optional(),
    phosphorusPpm: z.number().finite().min(0).max(10_000),
    potassiumPpm: z.number().finite().min(0).max(50_000).optional(),
    potassium: TypedPotassiumSchema.optional(),
    organicMatterPercent: z.number().finite().min(0).max(100).optional(),
    organicMatterPct: z.number().finite().min(0).max(100).optional(),
    provenance: z.enum(["lab_confirmed", "field_kit", "farmer_reported", "modelled_estimate"]).optional(),
    extractionMethod: z.string().trim().min(1).max(64).optional(),
    samplingDepthCm: z.number().finite().positive().max(100).optional(),
    testDate: z.string().trim().min(1).max(40).optional(),
  })
  .refine((soil) => soil.pH !== undefined || soil.ph !== undefined, {
    message: "Soil pH is required.",
  })
  .refine((soil) => soil.organicMatterPercent !== undefined || soil.organicMatterPct !== undefined, {
    message: "Soil organic matter is required.",
  })
  .refine((soil) => soil.potassiumPpm !== undefined || soil.potassium !== undefined, {
    message: "Soil potassium is required.",
  })
  .transform((soil) => ({
    pH: soil.pH ?? soil.ph!,
    phosphorusPpm: soil.phosphorusPpm,
    ...(soil.potassiumPpm !== undefined ? { potassiumPpm: soil.potassiumPpm } : {}),
    ...(soil.potassium !== undefined ? { potassium: soil.potassium } : {}),
    organicMatterPercent: soil.organicMatterPercent ?? soil.organicMatterPct!,
    ...(soil.provenance !== undefined ? { provenance: soil.provenance } : {}),
    ...(soil.extractionMethod !== undefined ? { extractionMethod: soil.extractionMethod } : {}),
    ...(soil.samplingDepthCm !== undefined ? { samplingDepthCm: soil.samplingDepthCm } : {}),
    ...(soil.testDate !== undefined ? { testDate: soil.testDate } : {}),
  }));

export const FertiliserSchema = z.object({
  cropId: z.enum(SUPPORTED_FERTILISER_CROP_IDS),
  targetYieldTonnesPerHa: z.number().finite().positive().max(100),
  farmAreaHectares: z.number().finite().positive().max(100_000),
  soil: SoilSchema,
  zone: z.string().trim().min(1).max(64).optional(),
  growthStage: z.string().trim().min(1).max(64).optional(),
  requireStrictSoilProvenance: z.boolean().optional(),
});
