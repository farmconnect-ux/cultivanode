import type { FarmerContext, GroundedKnowledgeSnippet } from './types';
import { getCropById } from '../agronomy/catalogue';
import { getCropTemplate } from '../agronomy/templates';
import { PUBLISHED_STANDARDS } from '../agronomy/standards';

/**
 * Retrieves verified, approved agronomic standards and template facts to ground AI generation.
 */
export function retrieveGroundedContext(context: FarmerContext): GroundedKnowledgeSnippet[] {
  const snippets: GroundedKnowledgeSnippet[] = [];

  // 1. Crop facts
  const crop = getCropById(context.cropId);
  if (crop) {
    snippets.push({
      sourceTitle: `${crop.commonName} Agronomy Reference`,
      sourceVersion: 1,
      approvedBy: 'CultivaNode Agronomy Board',
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
        sourceTitle: `Approved Operation: ${op.name}`,
        sourceVersion: template.version,
        approvedBy: 'IITA / NIHORT Guidelines',
        content: `Stage: ${op.stageName}. Days relative: ${op.relativeStartDay} to ${op.relativeEndDay}. Description: ${op.description}`,
      });
    }
  }

  // 3. Standards
  const standardKey = `${context.cropId}_gap_v1`;
  const standard = PUBLISHED_STANDARDS[standardKey];
  if (standard) {
    snippets.push({
      sourceTitle: standard.title,
      sourceVersion: standard.version,
      approvedBy: standard.approvedBy,
      content: `Mandatory operations: ${standard.mandatedOperations.join(', ')}. Banned chemicals: ${standard.restrictedChemicals.join(', ')}. Max N: ${standard.maxFertiliserNitrogenKgPerHa} kg/ha.`,
    });
  }

  return snippets;
}
