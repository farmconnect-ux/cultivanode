import type { CropDefinition } from './types';

export const CROP_CATALOGUE: CropDefinition[] = [
  // --- 8 FIELD & STAPLE CROPS (PHASE 1) ---
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
      { id: 'hembakwase', name: 'Hembakwase Export', daysToMaturity: 270, expectedYieldTonnesPerHa: 22.0, description: 'Uniform cylindrical tubers suited for ware yam and export.' },
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
    id: 'cowpea',
    commonName: 'Cowpea (Beans)',
    scientificName: 'Vigna unguiculata',
    category: 'legume',
    suitableZones: ['derived_savanna', 'rainforest'],
    varieties: [
      { id: 'sampea-14', name: 'SAMPEA 14', daysToMaturity: 65, expectedYieldTonnesPerHa: 1.8, description: 'Early maturing, pod-borer resistant brown beans.' },
      { id: 'ife-brown', name: 'Ife Brown', daysToMaturity: 75, expectedYieldTonnesPerHa: 2.0, description: 'Popular large-seeded brown cowpea in South-West markets.' },
    ],
  },
  {
    id: 'plantain',
    commonName: 'Plantain / Banana',
    scientificName: 'Musa paradisiaca',
    category: 'tuber',
    suitableZones: ['rainforest', 'derived_savanna'],
    varieties: [
      { id: 'agbagba', name: 'Agbagba (Giant Horn)', daysToMaturity: 360, expectedYieldTonnesPerHa: 18.0, description: 'Standard false horn plantain preferred in South-West markets.' },
      { id: 'pita-24', name: 'PITA 24 (IITA Hybrid)', daysToMaturity: 330, expectedYieldTonnesPerHa: 22.0, description: 'Black sigatoka resistant hybrid with high bunch yield.' },
    ],
  },
  {
    id: 'egusi',
    commonName: 'Egusi Melon',
    scientificName: 'Citrullus colocynthis',
    category: 'legume',
    suitableZones: ['derived_savanna', 'rainforest'],
    varieties: [
      { id: 'bara-local', name: 'Bara (Osun Local)', daysToMaturity: 105, expectedYieldTonnesPerHa: 1.4, description: 'Large white-seed melon ideal for intercropping with yam/cassava.' },
      { id: 'brown-seed', name: 'West African Brown', daysToMaturity: 110, expectedYieldTonnesPerHa: 1.2, description: 'Thick seedcoat, drought tolerant, rapid soil cover.' },
    ],
  },
  {
    id: 'sweet_potato',
    commonName: 'Sweet Potato',
    scientificName: 'Ipomoea batatas',
    category: 'tuber',
    suitableZones: ['derived_savanna', 'rainforest'],
    varieties: [
      { id: 'mothers-delight', name: "Mother's Delight (OFSP)", daysToMaturity: 95, expectedYieldTonnesPerHa: 22.0, description: 'Orange-fleshed sweet potato rich in pro-vitamin A.' },
      { id: 'tis-87-0087', name: 'TIS 87/0087 (White Fleshed)', daysToMaturity: 120, expectedYieldTonnesPerHa: 25.0, description: 'High dry matter white tuber suited for boiling and processing.' },
    ],
  },

  // --- 7 VEGETABLES (PHASE 1) ---
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
    commonName: 'Pepper (Tatashe, Rodo, Shombo)',
    scientificName: 'Capsicum chinense',
    category: 'vegetable',
    suitableZones: ['rainforest', 'derived_savanna'],
    varieties: [
      { id: 'atarodo-local', name: 'Ata Rodo (Scotch Bonnet)', daysToMaturity: 90, expectedYieldTonnesPerHa: 15.0, description: 'High pungency red scotch bonnet.' },
      { id: 'tatashe-f1', name: 'Tatashe Red King', daysToMaturity: 100, expectedYieldTonnesPerHa: 18.0, description: 'Long bell pepper with thick pericarp, sweet and mildly hot.' },
      { id: 'shombo-cayenne', name: 'Shombo (Cayenne)', daysToMaturity: 85, expectedYieldTonnesPerHa: 16.0, description: 'Slender hot chili for fresh market and drying.' },
    ],
  },
  {
    id: 'okra',
    commonName: 'Okra',
    scientificName: 'Abelmoschus esculentus',
    category: 'vegetable',
    suitableZones: ['rainforest', 'derived_savanna'],
    varieties: [
      { id: 'clemson-spineless', name: 'Clemson Spineless', daysToMaturity: 55, expectedYieldTonnesPerHa: 12.0, description: 'Prolific straight spineless pods, rapid regeneration.' },
      { id: 'nh47-4', name: 'NH47-4 (NIHORT Selection)', daysToMaturity: 50, expectedYieldTonnesPerHa: 14.0, description: 'High mucilage content, ideal for South-West stew consumption.' },
    ],
  },
  {
    id: 'amaranth',
    commonName: 'Amaranth (Tete)',
    scientificName: 'Amaranthus cruentus',
    category: 'vegetable',
    suitableZones: ['rainforest', 'derived_savanna'],
    varieties: [
      { id: 'tete-elegbede', name: 'Tete Elegbede', daysToMaturity: 25, expectedYieldTonnesPerHa: 15.0, description: 'Broad tender green leaves, rapid ratoon regrowths.' },
    ],
  },
  {
    id: 'ewedu',
    commonName: 'Jute Mallow (Ewedu)',
    scientificName: 'Corchorus olitorius',
    category: 'vegetable',
    suitableZones: ['rainforest', 'derived_savanna'],
    varieties: [
      { id: 'oniyaya-broad', name: 'Oniyaya (Broad Leaf)', daysToMaturity: 30, expectedYieldTonnesPerHa: 18.0, description: 'High draw/viscosity leaf popular across Lagos, Oyo and Ogun.' },
      { id: 'amugbadu', name: 'Amugbadu', daysToMaturity: 35, expectedYieldTonnesPerHa: 16.0, description: 'Serrate leaf, highly disease tolerant and drought hardy.' },
    ],
  },
  {
    id: 'cucumber',
    commonName: 'Cucumber',
    scientificName: 'Cucumis sativus',
    category: 'vegetable',
    suitableZones: ['rainforest', 'derived_savanna'],
    varieties: [
      { id: 'darina-f1', name: 'Darina F1', daysToMaturity: 50, expectedYieldTonnesPerHa: 30.0, description: 'Gynoecious hybrid, dark green straight fruits, downy mildew tolerant.' },
      { id: 'marketer', name: 'Marketer', daysToMaturity: 60, expectedYieldTonnesPerHa: 20.0, description: 'Standard open-pollinated field variety.' },
    ],
  },
  {
    id: 'watermelon',
    commonName: 'Watermelon',
    scientificName: 'Citrullus lanatus',
    category: 'vegetable',
    suitableZones: ['derived_savanna', 'rainforest'],
    varieties: [
      { id: 'kaolack', name: 'Kaolack', daysToMaturity: 75, expectedYieldTonnesPerHa: 35.0, description: 'Striped round melon with crisp red sweet flesh, tough rind.' },
      { id: 'sugar-baby', name: 'Sugar Baby', daysToMaturity: 70, expectedYieldTonnesPerHa: 28.0, description: 'Small dark-green fruit, high brix sugar content.' },
    ],
  },

  // --- PERENNIAL TREE CROPS (PHASE 1.5 EXPANSION) ---
  {
    id: 'cocoa',
    commonName: 'Cocoa (Phase 1.5)',
    scientificName: 'Theobroma cacao',
    category: 'tree_crop',
    suitableZones: ['rainforest'],
    varieties: [
      { id: 'crin-tc-series', name: 'CRIN TC Series (Amazon Hybrid)', daysToMaturity: 730, expectedYieldTonnesPerHa: 1.5, description: 'Early bearing, black-pod disease tolerant.' },
    ],
  },
  {
    id: 'oil_palm',
    commonName: 'Oil Palm (Phase 1.5)',
    scientificName: 'Elaeis guineensis',
    category: 'tree_crop',
    suitableZones: ['rainforest'],
    varieties: [
      { id: 'nifor-tenera', name: 'NIFOR Tenera Hybrid', daysToMaturity: 1095, expectedYieldTonnesPerHa: 18.0, description: 'High oil extraction ratio, thin shell.' },
    ],
  },
  {
    id: 'cashew',
    commonName: 'Cashew (Phase 1.5)',
    scientificName: 'Anacardium occidentale',
    category: 'tree_crop',
    suitableZones: ['derived_savanna', 'rainforest'],
    varieties: [
      { id: 'jumbo-nut', name: 'Jumbo Nut Selection', daysToMaturity: 1095, expectedYieldTonnesPerHa: 1.2, description: 'Large kernel export quality nuts.' },
    ],
  },
];

export function getCropById(cropId: string): CropDefinition | undefined {
  return CROP_CATALOGUE.find((c) => c.id === cropId);
}
