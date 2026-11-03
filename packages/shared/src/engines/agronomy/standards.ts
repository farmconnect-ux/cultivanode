import type { AgronomicStandard } from './types';

export const PUBLISHED_STANDARDS: Record<string, AgronomicStandard> = {
  maize_gap_v1: {
    id: 'maize_gap_v1',
    cropId: 'maize',
    title: 'Nigerian Good Agricultural Practices (GAP) for Commercial Maize (Draft)',
    version: 1,
    status: 'draft',
    mandatedOperations: ['Ploughing & Harrowing', 'Planting & Basal Fertilisation', 'First Weeding / Post-emergence Spray'],
    restrictedChemicals: ['paraquat', 'carbofuran', 'ddt'],
    maxFertiliserNitrogenKgPerHa: 120,
    approvedBy: 'Draft Reference (Pending Agronomist Sign-off)',
    approvedAt: 'Pending',
  },
  tomato_gap_v1: {
    id: 'tomato_gap_v1',
    cropId: 'tomato',
    title: 'Nigerian GAP for Commercial Open-Field Tomato (Draft)',
    version: 1,
    status: 'draft',
    mandatedOperations: ['Nursery Bed Sowing', 'Transplanting to Main Field', 'Staking & Trellising'],
    restrictedChemicals: ['paraquat', 'monocrotophos'],
    maxFertiliserNitrogenKgPerHa: 150,
    approvedBy: 'Draft Reference (Pending Agronomist Sign-off)',
    approvedAt: 'Pending',
  },
};

export interface StandardsValidationResult {
  compliant: boolean;
  violations: string[];
}

export function validateAgainstStandard(
  standardId: string,
  operationsPerformed: string[],
  chemicalsUsed: string[],
  nitrogenAppliedKgPerHa: number
): StandardsValidationResult {
  const standard = PUBLISHED_STANDARDS[standardId];
  if (!standard) {
    return { compliant: true, violations: [] }; // No standard enforced
  }

  const violations: string[] = [];

  // Check mandated operations
  for (const mandated of standard.mandatedOperations) {
    if (!operationsPerformed.includes(mandated)) {
      violations.push(`Mandated operation missing: ${mandated}`);
    }
  }

  // Check restricted chemicals
  for (const chemical of chemicalsUsed) {
    if (standard.restrictedChemicals.includes(chemical.toLowerCase())) {
      violations.push(`Restricted/banned agrochemical used: ${chemical}`);
    }
  }

  // Check nitrogen cap
  if (nitrogenAppliedKgPerHa > standard.maxFertiliserNitrogenKgPerHa) {
    violations.push(
      `Nitrogen application (${nitrogenAppliedKgPerHa} kg/ha) exceeds GAP standard cap of ${standard.maxFertiliserNitrogenKgPerHa} kg/ha`
    );
  }

  return {
    compliant: violations.length === 0,
    violations,
  };
}
