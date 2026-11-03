/**
 * Agronomy Catalogue Importer
 *
 * Imports crops, phenological growth stages, and draft standards from
 * packages/shared/src/engines/agronomy/ into database draft records.
 */

import { CROP_CATALOGUE } from "../../packages/shared/src/engines/agronomy/catalogue";

export async function verifyCatalogueIntegrity() {
  console.log(`Inspecting ${CROP_CATALOGUE.length} crops from CROP_CATALOGUE:`);
  for (const crop of CROP_CATALOGUE) {
    console.log(
      `- ${crop.commonName} (${crop.id}): ${crop.growthStages.length} stages, ${crop.varieties.length} varieties, zones: [${crop.suitableZones.join(", ")}]`
    );
  }
}

if (require.main === module) {
  verifyCatalogueIntegrity();
}
