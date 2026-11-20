import { z } from "zod";

export const SoilSchema = z.object({
  pH: z.number().finite().min(0).max(14).optional(),
  ph: z.number().finite().min(0).max(14).optional(),
  nitrogenPpm: z.number().finite().min(0).optional(),
  phosphorusPpm: z.number().finite().min(0),
  potassiumPpm: z.number().finite().min(0),
  organicMatterPercent: z.number().finite().min(0).max(100).optional(),
  organicMatterPct: z.number().finite().min(0).max(100).optional(),
}).refine((soil) => soil.pH !== undefined || soil.ph !== undefined, {
  message: 'Soil pH is required.',
}).refine((soil) => soil.organicMatterPercent !== undefined || soil.organicMatterPct !== undefined, {
  message: 'Soil organic matter is required.',
}).transform((soil) => ({
  pH: soil.pH ?? soil.ph!,
  phosphorusPpm: soil.phosphorusPpm,
  potassiumPpm: soil.potassiumPpm,
  organicMatterPercent: soil.organicMatterPercent ?? soil.organicMatterPct!,
}));

export const FertiliserSchema = z.object({
  cropId: z.enum(['maize', 'tomato', 'cassava', 'yam', 'rice']),
  targetYieldTonnesPerHa: z.number().finite().positive().max(100),
  farmAreaHectares: z.number().finite().positive().max(100_000),
  soil: SoilSchema,
});
