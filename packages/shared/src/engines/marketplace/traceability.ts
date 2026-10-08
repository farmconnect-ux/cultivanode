import type { ProduceTraceabilityReport } from './types';

export interface RawProvenanceRecord {
  listingId: string;
  batchCode?: string | null;
  farmId?: string | null;
  farmName?: string | null;
  farmState?: string | null;
  farmLga?: string | null;
  cropId?: string | null;
  varietyId?: string | null;
  season?: string | null;
  plantingDate?: string | null;
  harvestDate?: string | null;
  grade?: string | null;
  moisturePct?: number | null;
  isOrganic?: boolean | null;
  certifications?: string[] | null;
}

export class ProduceTraceabilityEngine {
  /**
   * Builds an audited traceability report from provenance records.
   */
  static buildTraceabilityReport(record: RawProvenanceRecord): ProduceTraceabilityReport {
    const hasFarm = Boolean(record.farmId && record.farmName);
    const hasBatch = Boolean(record.batchCode);

    return {
      listingId: record.listingId,
      batchCode: record.batchCode ?? undefined,
      farm: hasFarm
        ? {
            id: record.farmId!,
            name: record.farmName!,
            state: record.farmState ?? 'Unknown',
            lga: record.farmLga ?? 'Unknown',
          }
        : undefined,
      crop:
        record.cropId && record.varietyId
          ? {
              cropId: record.cropId,
              varietyId: record.varietyId,
              season: record.season ?? 'early_rainy',
              plantingDate: record.plantingDate ?? '',
              harvestDate: record.harvestDate ?? '',
            }
          : undefined,
      quality: {
        grade: record.grade ?? 'grade_a',
        moisturePct: record.moisturePct ?? undefined,
        isOrganic: record.isOrganic ?? false,
        certifications: record.certifications ?? [],
      },
      provenanceVerified: hasFarm && hasBatch,
    };
  }
}
