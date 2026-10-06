import type { CropDefinition } from './types';

export const CROP_CATALOGUE: CropDefinition[] = [
  {
    id: 'maize',
    commonName: 'Maize (Corn)',
    scientificName: 'Zea mays',
    category: 'cereal',
    suitableZones: ['rainforest', 'derived_savanna'],
    varieties: [
      { id: 'sammaz-15', name: 'SAMMAZ 15 (White)', daysToMaturity: 105, expectedYieldTonnesPerHa: 5.5, description: 'High-yielding white grain, resistant to striga and drought.' },
      { id: 'sammaz-16', name: 'SAMMAZ 16 (Yellow)', daysToMaturity: 110, expectedYieldTonnesPerHa: 6.0, description: 'Pro-vitamin A biofortified yellow maize.' },
      { id: 'oba-super-2', name: 'Oba Super 2 (Hybrid)', daysToMaturity: 100, expectedYieldTonnesPerHa: 7.0, description: 'High commercial grain hybrid for South-West early season.' },
    ],
  },
  {
    id: 'cassava',
    commonName: 'Cassava',
    scientificName: 'Manihot esculenta',
    category: 'tuber',
    suitableZones: ['rainforest', 'derived_savanna'],
    varieties: [
      { id: 'tme-419', name: 'TME 419', daysToMaturity: 360, expectedYieldTonnesPerHa: 28.0, description: 'Industry standard for starch and garri; high dry matter content.' },
      { id: 'tms-980505', name: 'TMS 98/0505', daysToMaturity: 330, expectedYieldTonnesPerHa: 25.0, description: 'Resistant to cassava mosaic disease, vigorous canopy.' },
    ],
  },
  {
    id: 'yam',
    commonName: 'White Yam',
    scientificName: 'Dioscorea rotundata',
    category: 'tuber',
    suitableZones: ['rainforest', 'derived_savanna'],
    varieties: [
      { id: 'tdr-89-02665', name: 'TDr 89/02665 (Amula)', daysToMaturity: 240, expectedYieldTonnesPerHa: 20.0, description: 'High dry-matter pounded yam variety.' },
    ],
  },
  {
    id: 'tomato',
    commonName: 'Tomato',
    scientificName: 'Solanum lycopersicum',
    category: 'vegetable',
    suitableZones: ['rainforest', 'derived_savanna'],
    varieties: [
      { id: 'coba-f1', name: 'Cobra F1', daysToMaturity: 75, expectedYieldTonnesPerHa: 35.0, description: 'Heat-tolerant hybrid with firm fruits for commercial transport.' },
      { id: 'roma-vf', name: 'Roma VF', daysToMaturity: 80, expectedYieldTonnesPerHa: 22.0, description: 'Open-pollinated plum tomato, good wilt tolerance.' },
    ],
  },
  {
    id: 'pepper',
    commonName: 'Hot Pepper (Habanero / Rodo)',
    scientificName: 'Capsicum chinense',
    category: 'vegetable',
    suitableZones: ['rainforest', 'derived_savanna'],
    varieties: [
      { id: 'atarodo-local', name: 'Ata Rodo Local', daysToMaturity: 90, expectedYieldTonnesPerHa: 15.0, description: 'High pungency red scotch bonnet.' },
    ],
  },
  {
    id: 'rice',
    commonName: 'Rice (Lowland & Upland)',
    scientificName: 'Oryza sativa',
    category: 'cereal',
    suitableZones: ['rainforest', 'derived_savanna'],
    varieties: [
      { id: 'faro-44', name: 'FARO 44 (SiPi)', daysToMaturity: 115, expectedYieldTonnesPerHa: 6.5, description: 'Semi-dwarf lowland variety, high milling recovery.' },
      { id: 'faro-52', name: 'FARO 52 (NERICA 1)', daysToMaturity: 95, expectedYieldTonnesPerHa: 4.5, description: 'Drought-tolerant upland rice.' },
    ],
  },
  {
    id: 'soybean',
    commonName: 'Soybean',
    scientificName: 'Glycine max',
    category: 'legume',
    suitableZones: ['derived_savanna', 'rainforest'],
    varieties: [
      { id: 'tgx-1448-2e', name: 'TGx 1448-2E', daysToMaturity: 110, expectedYieldTonnesPerHa: 2.2, description: 'Promiscuous nodulation, high oil content.' },
    ],
  },
  {
    id: 'cowpea',
    commonName: 'Cowpea (Beans)',
    scientificName: 'Vigna unguiculata',
    category: 'legume',
    suitableZones: ['derived_savanna'],
    varieties: [
      { id: 'sampea-14', name: 'SAMPEA 14', daysToMaturity: 65, expectedYieldTonnesPerHa: 1.8, description: 'Early maturing, pod-borer resistant brown beans.' },
    ],
  },
  {
    id: 'oil_palm',
    commonName: 'Oil Palm',
    scientificName: 'Elaeis guineensis',
    category: 'tree_crop',
    suitableZones: ['rainforest'],
    varieties: [
      { id: 'nifor-tenera', name: 'NIFOR Tenera Hybrid', daysToMaturity: 1095, expectedYieldTonnesPerHa: 18.0, description: 'High oil extraction ratio, thin shell.' },
    ],
  },
  {
    id: 'cocoa',
    commonName: 'Cocoa',
    scientificName: 'Theobroma cacao',
    category: 'tree_crop',
    suitableZones: ['rainforest'],
    varieties: [
      { id: 'crin-tc-series', name: 'CRIN TC Series (Amazon Hybrid)', daysToMaturity: 730, expectedYieldTonnesPerHa: 1.5, description: 'Early bearing, black-pod disease tolerant.' },
    ],
  },
  {
    id: 'cashew',
    commonName: 'Cashew',
    scientificName: 'Anacardium occidentale',
    category: 'tree_crop',
    suitableZones: ['derived_savanna', 'rainforest'],
    varieties: [
      { id: 'jumbo-nut', name: 'Jumbo Nut Selection', daysToMaturity: 1095, expectedYieldTonnesPerHa: 1.2, description: 'Large kernel export quality nuts.' },
    ],
  },
  {
    id: 'plantain',
    commonName: 'Plantain',
    scientificName: 'Musa paradisiaca',
    category: 'tuber',
    suitableZones: ['rainforest'],
    varieties: [
      { id: 'agbagba', name: 'Agbagba (Giant Horn)', daysToMaturity: 360, expectedYieldTonnesPerHa: 18.0, description: 'Standard false horn plantain preferred in South-West markets.' },
    ],
  },
  {
    id: 'ginger',
    commonName: 'Ginger',
    scientificName: 'Zingiber officinale',
    category: 'tuber',
    suitableZones: ['derived_savanna', 'rainforest'],
    varieties: [
      { id: 'ug1-yellow', name: 'UG1 (Yellow Ginger)', daysToMaturity: 240, expectedYieldTonnesPerHa: 12.0, description: 'High oleoresin and pungency.' },
    ],
  },
  {
    id: 'sorghum',
    commonName: 'Sorghum (Guinea Corn)',
    scientificName: 'Sorghum bicolor',
    category: 'cereal',
    suitableZones: ['derived_savanna'],
    varieties: [
      { id: 'samsorg-40', name: 'SAMSORG 40', daysToMaturity: 110, expectedYieldTonnesPerHa: 3.5, description: 'Short-duration white sorghum.' },
    ],
  },
  {
    id: 'groundnut',
    commonName: 'Groundnut (Peanut)',
    scientificName: 'Arachis hypogaea',
    category: 'legume',
    suitableZones: ['derived_savanna'],
    varieties: [
      { id: 'samnut-24', name: 'SAMNUT 24', daysToMaturity: 90, expectedYieldTonnesPerHa: 2.8, description: 'Rosette disease resistant, high confectionery quality.' },
    ],
  },
];

export function getCropById(cropId: string): CropDefinition | undefined {
  return CROP_CATALOGUE.find((c) => c.id === cropId);
}
