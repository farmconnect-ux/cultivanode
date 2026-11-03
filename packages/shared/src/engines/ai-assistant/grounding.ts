import type { FarmerContext, GroundedKnowledgeSnippet } from './types';
import { getCropById } from '../agronomy/catalogue';
import { getCropTemplate } from '../agronomy/templates';
import { PUBLISHED_STANDARDS } from '../agronomy/standards';

/**
 * Retrieves reference agronomic guidelines and template facts to ground AI generation.
 * Note: Until standards pass the agronomist review pipeline, all snippets are flagged as draft references.
 */
export function retrieveGroundedContext(context: FarmerContext): GroundedKnowledgeSnippet[] {
  const snippets: GroundedKnowledgeSnippet[] = [];

  // 1. Crop facts
  const crop = getCropById(context.cropId);
  if (crop) {
    snippets.push({
      sourceTitle: `${crop.commonName} Agronomy Reference (Draft)`,
      sourceVersion: 1,
      status: 'draft',
      approvedBy: 'Draft Reference (Not yet agronomist-reviewed)',
      content: `${crop.commonName} (${crop.scientificName}) suitable for ${crop.suitableZones.join(', ')} zones.`,
    });
  }

  // 2. Lifecycle template operations for current or near stages
  const template = getCropTemplate(context.cropId);
  if (template) {
    const relevantOps = context.stageName
      ? template.operations.filter((op) => op.stageName.toLowerCase().includes(context.stageName!.toLowerCase()))
      : template.operations.slice(0, 3);

    for (const op of relevantOps) {
      snippets.push({
        sourceTitle: `Draft Operation Guideline: ${op.name}`,
        sourceVersion: template.version,
        status: 'draft',
        approvedBy: 'Public Agricultural Reference (Pending Agronomist Verification)',
        content: `Stage: ${op.stageName}. Days relative: ${op.relativeStartDay} to ${op.relativeEndDay}. Description: ${op.description}`,
      });
    }
  }

  // 3. Standards
  const standardKey = `${context.cropId}_gap_v1`;
  const standard = PUBLISHED_STANDARDS[standardKey];
  if (standard) {
    snippets.push({
      sourceTitle: `${standard.title} (Draft Benchmark)`,
      sourceVersion: standard.version,
      status: 'draft',
      approvedBy: 'Draft Reference (Pending Regulatory Review)',
      content: `Mandatory operations: ${standard.mandatedOperations.join(', ')}. Banned chemicals: ${standard.restrictedChemicals.join(', ')}. Max N: ${standard.maxFertiliserNitrogenKgPerHa} kg/ha.`,
    });
  }

  return snippets;
}
