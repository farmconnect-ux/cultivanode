import type { CropDefinition, GrowthStageDefinition } from './types';
import type { FarmZone } from '../../roles';

export const CROP_CATALOGUE: CropDefinition[] = [
  // --- 8 FIELD & STAPLE CROPS (PHASE 1) ---
  {
    id: 'maize',
    commonName: 'Maize (Corn)',
    scientificName: 'Zea mays',
    localNames: { yo: 'Àgbàdo', pcm: 'Kón', ha: 'Masara', ig: 'Ọka' },
    category: 'cereal',
    suitableZones: ['rainforest', 'derived_savanna'],
    typicalDurationDays: 105,
    spacing: { interRowCm: 75, intraRowCm: 25 },
    seedRate: { amountPerHa: 20, unit: 'kg' },
    growthStages: [
      { id: 'germination', name: 'Germination & Emergence', order: 1, relativeStartDay: 0, relativeEndDay: 7, description: 'Radicle and coleoptile emergence through soil surface.' },
      { id: 'seedling', name: 'Seedling (V2-V4)', order: 2, relativeStartDay: 8, relativeEndDay: 20, description: 'Early vegetative development with active root elongation.' },
      { id: 'vegetative', name: 'Active Vegetative (V6-V12)', order: 3, relativeStartDay: 21, relativeEndDay: 50, description: 'Rapid stalk elongation; knee-high stage and topdress urea window.' },
      { id: 'tasseling', name: 'Tasseling & Silking (VT-R1)', order: 4, relativeStartDay: 51, relativeEndDay: 65, description: 'Pollen shed and silk emergence; critical moisture period.' },
      { id: 'grain_filling', name: 'Grain Filling (R2-R5)', order: 5, relativeStartDay: 66, relativeEndDay: 90, description: 'Blister, milk, dough, and dent kernel development.' },
      { id: 'maturity', name: 'Physiological Maturity (R6)', order: 6, relativeStartDay: 91, relativeEndDay: 105, description: 'Black layer formation at kernel base; moisture drops below 20%.' },
    ],
    harvestIndicators: ['Black layer formation at base of kernels', 'Husk turns completely dry and straw-colored', 'Grain moisture below 20%'],
    postHarvestRequirements: ['Shelling with mechanical thresher or hand sheller', 'Sun drying on clean tarpaulin to 12-13% moisture', 'Hermetic bag storage (PICS bags) against weevils'],
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
    localNames: { yo: 'Gbaágùdá / Ègè', pcm: 'Kassava', ha: 'Rogo', ig: 'Akpụ' },
    category: 'tuber',
    suitableZones: ['rainforest', 'derived_savanna'],
    typicalDurationDays: 360,
    spacing: { interRowCm: 100, intraRowCm: 100 },
    seedRate: { amountPerHa: 50, unit: 'bundles_of_50_stems' },
    growthStages: [
      { id: 'sprouting', name: 'Sprouting & Root Initiation', order: 1, relativeStartDay: 0, relativeEndDay: 30, description: 'Bud sprouting on cuttings and adventitious root formation.' },
      { id: 'early_canopy', name: 'Canopy Formation & Early Bulking', order: 2, relativeStartDay: 31, relativeEndDay: 90, description: 'Rapid shoot and leaf area expansion; storage root initiation.' },
      { id: 'canopy_closure', name: 'Full Canopy & Maximum Bulking', order: 3, relativeStartDay: 91, relativeEndDay: 240, description: 'Complete weed suppression; primary carbohydrate storage in roots.' },
      { id: 'dormancy_maturation', name: 'Maturation & Starch Bulking', order: 4, relativeStartDay: 241, relativeEndDay: 360, description: 'High dry-matter accumulation; ready for harvest.' },
    ],
    harvestIndicators: ['Leaf senescence and leaf fall at base', 'Soil cracking around the base of the stems', 'Test digging reveals thick root bark and high starch'],
    postHarvestRequirements: ['Process within 48-72 hours of harvest to avoid vascular streaking', 'Peeling and grating for Garri, Fufu, or HQCF starch'],
    varieties: [
      { id: 'tme-419', name: 'TME 419', daysToMaturity: 360, expectedYieldTonnesPerHa: 28.0, description: 'Industry standard for starch and garri; high dry matter content.' },
      { id: 'tms-980505', name: 'TMS 98/0505', daysToMaturity: 330, expectedYieldTonnesPerHa: 25.0, description: 'Resistant to cassava mosaic disease, vigorous canopy.' },
    ],
  },
  {
    id: 'yam',
    commonName: 'White Yam',
    scientificName: 'Dioscorea rotundata',
    localNames: { yo: 'Iṣu', pcm: 'Yam', ha: 'Doya', ig: 'Ji' },
    category: 'tuber',
    suitableZones: ['rainforest', 'derived_savanna'],
    typicalDurationDays: 240,
    spacing: { interRowCm: 100, intraRowCm: 100 },
    seedRate: { amountPerHa: 2500, unit: 'kg_minisetts' },
    growthStages: [
      { id: 'sprouting', name: 'Sprouting & Emergence', order: 1, relativeStartDay: 0, relativeEndDay: 40, description: 'Shoot emergence from capped mounds or deep ridges.' },
      { id: 'foliage_growth', name: 'Vine Elongation & Staking', order: 2, relativeStartDay: 41, relativeEndDay: 90, description: 'Vigorous climbing; training vines onto stakes.' },
      { id: 'tuber_bulking', name: 'Tuber Initiation & Expansion', order: 3, relativeStartDay: 91, relativeEndDay: 180, description: 'Underground tuber swelling; high potassium demand.' },
      { id: 'maturity', name: 'Senescence & Maturity', order: 4, relativeStartDay: 181, relativeEndDay: 240, description: 'Foliage yellows and withers; tuber skin hardens.' },
    ],
    harvestIndicators: ['Vines and leaves completely dried and yellowed', 'Neck of the tuber firm and corky', 'Soil cracking around mound peaks'],
    postHarvestRequirements: ['Curing in shade for 7-10 days to heal harvesting bruises', 'Storage in traditional ventilated yam barns with rodent guards'],
    varieties: [
      { id: 'tdr-89-02665', name: 'TDr 89/02665 (Amula)', daysToMaturity: 240, expectedYieldTonnesPerHa: 20.0, description: 'High dry-matter pounded yam variety.' },
      { id: 'hembakwase', name: 'Hembakwase Export', daysToMaturity: 270, expectedYieldTonnesPerHa: 22.0, description: 'Uniform cylindrical tubers suited for ware yam and export.' },
    ],
  },
  {
    id: 'rice',
    commonName: 'Rice (Lowland & Upland)',
    scientificName: 'Oryza sativa',
    localNames: { yo: 'Ìrẹsì', pcm: 'Rais', ha: 'Shinkafa', ig: 'Osikapa' },
    category: 'cereal',
    typicalDurationDays: 115,
    suitableZones: ['rainforest', 'derived_savanna'],
    spacing: { interRowCm: 20, intraRowCm: 20 },
    seedRate: { amountPerHa: 60, unit: 'kg' },
    growthStages: [
      { id: 'vegetative_tillering', name: 'Seedling & Active Tillering', order: 1, relativeStartDay: 0, relativeEndDay: 35, description: 'Plant establishment and tiller multiplication in flooded or bunded field.' },
      { id: 'panicle_initiation', name: 'Stem Elongation & Panicle Initiation', order: 2, relativeStartDay: 36, relativeEndDay: 65, description: 'Internode elongation; boot stage; second urea split application.' },
      { id: 'flowering_heading', name: 'Heading & Flowering (Anthesis)', order: 3, relativeStartDay: 66, relativeEndDay: 85, description: 'Panicle emergence and pollination; avoid moisture stress.' },
      { id: 'grain_filling_ripening', name: 'Milky, Dough & Mature Ripening', order: 4, relativeStartDay: 86, relativeEndDay: 115, description: 'Grains turn golden yellow; drainage before harvest.' },
    ],
    harvestIndicators: ['80-85% of panicles turn straw-gold', 'Grains in lower part of panicle are hard and firm', 'Moisture level drops to 20-22%'],
    postHarvestRequirements: ['Threshing immediately after cut to prevent shattering losses', 'Parboiling and drying to 13-14% moisture before milling'],
    varieties: [
      { id: 'faro-44', name: 'FARO 44 (SiPi)', daysToMaturity: 115, expectedYieldTonnesPerHa: 6.5, description: 'Semi-dwarf lowland variety, high milling recovery.' },
      { id: 'faro-52', name: 'FARO 52 (NERICA 1)', daysToMaturity: 95, expectedYieldTonnesPerHa: 4.5, description: 'Drought-tolerant upland rice.' },
    ],
  },
  {
    id: 'cowpea',
    commonName: 'Cowpea (Beans)',
    scientificName: 'Vigna unguiculata',
    localNames: { yo: 'Ẹwà', pcm: 'Bins', ha: 'Wake', ig: 'Agwa' },
    category: 'legume',
    typicalDurationDays: 70,
    suitableZones: ['derived_savanna', 'rainforest'],
    spacing: { interRowCm: 75, intraRowCm: 20 },
    seedRate: { amountPerHa: 25, unit: 'kg' },
    growthStages: [
      { id: 'seedling_vegetative', name: 'Seedling & Vegetative', order: 1, relativeStartDay: 0, relativeEndDay: 30, description: 'Emergence, trifoliate leaf development, nodulation.' },
      { id: 'budding_flowering', name: 'Budding & Flowering', order: 2, relativeStartDay: 31, relativeEndDay: 48, description: 'Flower bud emergence; critical scouting for thrips.' },
      { id: 'podding', name: 'Pod Set & Pod Filling', order: 3, relativeStartDay: 49, relativeEndDay: 60, description: 'Rapid pod elongation; maruca pod borer protection.' },
      { id: 'maturity', name: 'Pod Drying & Maturity', order: 4, relativeStartDay: 61, relativeEndDay: 75, description: 'Pods turn dry brown and brittle.' },
    ],
    harvestIndicators: ['Pods turn dry, brown, and brittle', 'Seeds rattle inside pods when shaken', 'Morning harvesting before midday sun causes shattering'],
    postHarvestRequirements: ['Threshing on clean tarpaulin', 'Solarisation or hermetic PICS bag storage to eliminate bruchids'],
    varieties: [
      { id: 'sampea-14', name: 'SAMPEA 14', daysToMaturity: 65, expectedYieldTonnesPerHa: 1.8, description: 'Early maturing, pod-borer resistant brown beans.' },
      { id: 'ife-brown', name: 'Ife Brown', daysToMaturity: 75, expectedYieldTonnesPerHa: 2.0, description: 'Popular large-seeded brown cowpea in South-West markets.' },
    ],
  },
  {
    id: 'plantain',
    commonName: 'Plantain / Banana',
    scientificName: 'Musa paradisiaca',
    localNames: { yo: 'Ọ̀gẹ̀dẹ̀ Agbagba', pcm: 'Plantain', ha: 'Ayaba', ig: 'Ogede' },
    category: 'tuber',
    typicalDurationDays: 360,
    suitableZones: ['rainforest', 'derived_savanna'],
    spacing: { interRowCm: 300, intraRowCm: 200 },
    seedRate: { amountPerHa: 1666, unit: 'suckers' },
    growthStages: [
      { id: 'establishment', name: 'Sucker Establishment', order: 1, relativeStartDay: 0, relativeEndDay: 60, description: 'Rooting from pared corm and first leaf unfurling.' },
      { id: 'pseudostem_vegetative', name: 'Vegetative Pseudostem Growth', order: 2, relativeStartDay: 61, relativeEndDay: 210, description: 'Rapid trunk thickness growth and ratoon sucker emergence.' },
      { id: 'shooting_flowering', name: 'Shooting & Inflorescence', order: 3, relativeStartDay: 211, relativeEndDay: 260, description: 'Bunch shooting; true flower emergence from apex.' },
      { id: 'bunch_filling', name: 'Bunch Filling & Maturation', order: 4, relativeStartDay: 261, relativeEndDay: 360, description: 'Finger swelling and angular-to-round transformation.' },
    ],
    harvestIndicators: ['Fingers lose angular shape and become plump and rounded', 'Top finger on the first hand starts to turn pale green/yellow', 'Floral remnants at tip of fruit rub off easily'],
    postHarvestRequirements: ['Keep in cool shade; avoid direct sun exposure', 'Transport in padded crates to avoid bruising and premature ripening'],
    varieties: [
      { id: 'agbagba', name: 'Agbagba (Giant Horn)', daysToMaturity: 360, expectedYieldTonnesPerHa: 18.0, description: 'Standard false horn plantain preferred in South-West markets.' },
      { id: 'pita-24', name: 'PITA 24 (IITA Hybrid)', daysToMaturity: 330, expectedYieldTonnesPerHa: 22.0, description: 'Black sigatoka resistant hybrid with high bunch yield.' },
    ],
  },
  {
    id: 'egusi',
    commonName: 'Egusi Melon',
    scientificName: 'Citrullus colocynthis',
    localNames: { yo: 'Ẹ̀gúsí', pcm: 'Egusi', ha: 'Guna', ig: 'Egusi' },
    category: 'legume',
    typicalDurationDays: 105,
    suitableZones: ['derived_savanna', 'rainforest'],
    spacing: { interRowCm: 100, intraRowCm: 100 },
    seedRate: { amountPerHa: 5, unit: 'kg' },
    growthStages: [
      { id: 'emergence_vine', name: 'Emergence & Early Vine Run', order: 1, relativeStartDay: 0, relativeEndDay: 25, description: 'Cotyledon emergence and primary crawling vine development.' },
      { id: 'canopy_groundcover', name: 'Full Ground Cover & Flowering', order: 2, relativeStartDay: 26, relativeEndDay: 50, description: 'Dense foliage smothers weeds; male and female flowers open.' },
      { id: 'fruit_development', name: 'Melon Fruit Sizing', order: 3, relativeStartDay: 51, relativeEndDay: 85, description: 'Melon size expansion from green to mottled yellow.' },
      { id: 'maturity', name: 'Foliage Drying & Fruit Ripening', order: 4, relativeStartDay: 86, relativeEndDay: 105, description: 'Vines completely dry back; yellow melons ready for heap collection.' },
    ],
    harvestIndicators: ['Leaves and creeping vines completely withered and dry', 'Melon skin turns bright yellow with tough rind', 'Pedicel (stem attaching melon) turns dry and detaches easily'],
    postHarvestRequirements: ['Heap fermentation for 7-10 days to soften pulp', 'Pod cracking, seed washing in clean water, and sun drying to 8% moisture'],
    varieties: [
      { id: 'bara-local', name: 'Bara (Osun Local)', daysToMaturity: 105, expectedYieldTonnesPerHa: 1.4, description: 'Large white-seed melon ideal for intercropping with yam/cassava.' },
      { id: 'brown-seed', name: 'West African Brown', daysToMaturity: 110, expectedYieldTonnesPerHa: 1.2, description: 'Thick seedcoat, drought tolerant, rapid soil cover.' },
    ],
  },
  {
    id: 'sweet_potato',
    commonName: 'Sweet Potato',
    scientificName: 'Ipomoea batatas',
    localNames: { yo: 'Kùkúndùkú', pcm: 'Swit Potato', ha: 'Dankali', ig: 'Ji Bekee' },
    category: 'tuber',
    typicalDurationDays: 100,
    suitableZones: ['derived_savanna', 'rainforest'],
    spacing: { interRowCm: 100, intraRowCm: 30 },
    seedRate: { amountPerHa: 33000, unit: 'vine_cuttings_30cm' },
    growthStages: [
      { id: 'rooting_vine', name: 'Vine Establishment & Rooting', order: 1, relativeStartDay: 0, relativeEndDay: 25, description: 'Adventitious rooting from buried nodes of vine cuttings.' },
      { id: 'vegetative_spread', name: 'Vine Spread & Canopy Cover', order: 2, relativeStartDay: 26, relativeEndDay: 50, description: 'Rapid vine crawling into furrows; first weeding and earthing up.' },
      { id: 'tuber_bulking', name: 'Storage Root Bulking', order: 3, relativeStartDay: 51, relativeEndDay: 85, description: 'Root swelling; prevent Cylas weevil entry by re-mounding ridges.' },
      { id: 'maturity', name: 'Maturity & Harvest Window', order: 4, relativeStartDay: 86, relativeEndDay: 110, description: 'Tubers reach market size; sap dries quickly on test cuts.' },
    ],
    harvestIndicators: ['Leaves turn yellow and begin senescence', 'Test cut on tuber dries cleanly without turning dark', 'Soil mounding cracks prominently over swelling tubers'],
    postHarvestRequirements: ['Curing in shade at 28-30°C for 4-7 days to heal skin abrasions', 'Storage in dry, dark, well-aerated room away from direct sunlight'],
    varieties: [
      { id: 'mothers-delight', name: "Mother's Delight (OFSP)", daysToMaturity: 95, expectedYieldTonnesPerHa: 22.0, description: 'Orange-fleshed sweet potato rich in pro-vitamin A.' },
      { id: 'tis-87-0087', name: 'TIS 87/0087 (White Fleshed)', daysToMaturity: 120, expectedYieldTonnesPerHa: 25.0, description: 'High dry matter white tuber suited for boiling and processing.' },
    ],
  },

  // --- 7 FRESH MARKET VEGETABLES (PHASE 1) ---
  {
    id: 'tomato',
    commonName: 'Tomato',
    scientificName: 'Solanum lycopersicum',
    localNames: { yo: 'Tòmátì', pcm: 'Tomato', ha: 'Tumatur', ig: 'Tomato' },
    category: 'vegetable',
    typicalDurationDays: 80,
    suitableZones: ['rainforest', 'derived_savanna'],
    spacing: { interRowCm: 60, intraRowCm: 50 },
    seedRate: { amountPerHa: 150, unit: 'g_certified_seed' },
    growthStages: [
      { id: 'nursery', name: 'Nursery Seedbed Stage', order: 1, relativeStartDay: -28, relativeEndDay: 0, description: 'Tray sowing and 4-week hardening before field transplanting.' },
      { id: 'transplant_vegetative', name: 'Field Establishment & Staking', order: 2, relativeStartDay: 1, relativeEndDay: 25, description: 'Transplanting seedlings and erecting bamboo stakes.' },
      { id: 'flowering_fruitset', name: 'Flowering & Early Fruit Set', order: 3, relativeStartDay: 26, relativeEndDay: 50, description: 'Blossom development; preventative blight and calcium spray.' },
      { id: 'fruit_ripening', name: 'Fruit Sizing & Color Break', order: 4, relativeStartDay: 51, relativeEndDay: 80, description: 'Breaker stage to red-ripe harvesting in multiple flushes.' },
    ],
    harvestIndicators: ['Breaker stage: fruits develop star-pattern pink blush at blossom end', 'Firm fruit texture without softening', 'Uniform fruit sizing'],
    postHarvestRequirements: ['Harvest into plastic vented crates (no raffia baskets that cause crush losses)', 'Store at 13-15°C; do not refrigerate under 10°C to avoid chilling injury'],
    varieties: [
      { id: 'coba-f1', name: 'Cobra F1', daysToMaturity: 75, expectedYieldTonnesPerHa: 35.0, description: 'Heat-tolerant hybrid with firm fruits for commercial transport.' },
      { id: 'roma-vf', name: 'Roma VF', daysToMaturity: 80, expectedYieldTonnesPerHa: 22.0, description: 'Open-pollinated plum tomato, good wilt tolerance.' },
    ],
  },
  {
    id: 'pepper',
    commonName: 'Pepper (Tatashe, Rodo, Shombo)',
    scientificName: 'Capsicum chinense',
    localNames: { yo: 'Ata Rodo / Tatashe / Shombo', pcm: 'Pepa', ha: 'Attarugu', ig: 'Ose' },
    category: 'vegetable',
    typicalDurationDays: 95,
    suitableZones: ['rainforest', 'derived_savanna'],
    spacing: { interRowCm: 60, intraRowCm: 50 },
    seedRate: { amountPerHa: 200, unit: 'g_certified_seed' },
    growthStages: [
      { id: 'nursery', name: 'Nursery Seedbed Stage', order: 1, relativeStartDay: -35, relativeEndDay: 0, description: 'Slow initial growth in nursery trays under shade cloth.' },
      { id: 'establishment', name: 'Transplanting & Vegetative Bushing', order: 2, relativeStartDay: 1, relativeEndDay: 30, description: 'Branching and root system establishment on raised beds.' },
      { id: 'flowering_fruiting', name: 'Flowering & Continuous Fruit Set', order: 3, relativeStartDay: 31, relativeEndDay: 65, description: 'White star flowers and green pod development.' },
      { id: 'harvest_flushes', name: 'Ripe Fruit Harvest Flushes', order: 4, relativeStartDay: 66, relativeEndDay: 120, description: 'Regular fruit pickings every 5-7 days for 2 months.' },
    ],
    harvestIndicators: ['Fruit reaches full red/orange color according to cultivar', 'Firm pod walls with glossy skin', 'Snaps cleanly from stem at natural abscission zone'],
    postHarvestRequirements: ['Ventilated crate transport', 'Sort out sun-scalded or anthracnose-damaged fruits immediately'],
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
    localNames: { yo: 'Ilá', pcm: 'Okro', ha: 'Kubewa', ig: 'Ọkwụrụ' },
    category: 'vegetable',
    typicalDurationDays: 60,
    suitableZones: ['rainforest', 'derived_savanna'],
    spacing: { interRowCm: 60, intraRowCm: 30 },
    seedRate: { amountPerHa: 8, unit: 'kg' },
    growthStages: [
      { id: 'emergence_seedling', name: 'Direct Emergence & Seedling', order: 1, relativeStartDay: 0, relativeEndDay: 20, description: 'Soaked seeds germinate in 4-6 days; thin to 1 plant per hole.' },
      { id: 'vegetative_branching', name: 'Vegetative Growth & Budding', order: 2, relativeStartDay: 21, relativeEndDay: 45, description: 'Sturdy stem growth and yellow hibiscus-like flower buds.' },
      { id: 'harvest_cycle', name: 'Continuous Pod Picking', order: 3, relativeStartDay: 46, relativeEndDay: 90, description: 'Harvest tender green pods every 2-3 days to encourage new buds.' },
    ],
    harvestIndicators: ['Pods 5-8cm long with tender tip that snaps cleanly when bent', 'Before fibrous woody strings develop', 'Harvest every 48-72 hours'],
    postHarvestRequirements: ['Wear cotton gloves while picking to avoid skin irritation from pod spines', 'Pack in ventilated baskets; market within 24 hours of cutting'],
    varieties: [
      { id: 'clemson-spineless', name: 'Clemson Spineless', daysToMaturity: 55, expectedYieldTonnesPerHa: 12.0, description: 'Prolific straight spineless pods, rapid regeneration.' },
      { id: 'nh47-4', name: 'NH47-4 (NIHORT Selection)', daysToMaturity: 50, expectedYieldTonnesPerHa: 14.0, description: 'High mucilage content, ideal for South-West stew consumption.' },
    ],
  },
  {
    id: 'amaranth',
    commonName: 'Amaranth (Tete)',
    scientificName: 'Amaranthus cruentus',
    localNames: { yo: 'Tẹtẹ', pcm: 'Grin Vèj', ha: 'Alayyahu', ig: 'Inine' },
    category: 'vegetable',
    typicalDurationDays: 30,
    suitableZones: ['rainforest', 'derived_savanna'],
    spacing: { interRowCm: 20, intraRowCm: 10 },
    seedRate: { amountPerHa: 2, unit: 'kg_mixed_with_sand' },
    growthStages: [
      { id: 'emergence_thinning', name: 'Fine Line Sowing & Emergence', order: 1, relativeStartDay: 0, relativeEndDay: 10, description: 'Micro-seed germination; light watering with fine spray nozzle.' },
      { id: 'rapid_foliage', name: 'Rapid Foliage Expansion', order: 2, relativeStartDay: 11, relativeEndDay: 22, description: 'Tender broad leaf growth; light nitrogen topdress.' },
      { id: 'ratoon_cuttings', name: 'First Cut & Successive Flushes', order: 3, relativeStartDay: 23, relativeEndDay: 60, description: 'Harvest succulent shoot tips 15cm above soil; repeat every 12 days.' },
    ],
    harvestIndicators: ['Succulent crisp stems 25-35cm tall before flower spike emergence', 'Bright tender green leaves with zero insect holes'],
    postHarvestRequirements: ['Tie into standard bundles in shade', 'Keep moist with light water sprinkling; supply immediately to local wet market'],
    varieties: [
      { id: 'tete-elegbede', name: 'Tete Elegbede', daysToMaturity: 25, expectedYieldTonnesPerHa: 15.0, description: 'Broad tender green leaves, rapid ratoon regrowths.' },
    ],
  },
  {
    id: 'ewedu',
    commonName: 'Jute Mallow (Ewedu)',
    scientificName: 'Corchorus olitorius',
    localNames: { yo: 'Éwédú', pcm: 'Yoyo Vèj', ha: 'Lalo', ig: 'Ahihara' },
    category: 'vegetable',
    typicalDurationDays: 35,
    suitableZones: ['rainforest', 'derived_savanna'],
    spacing: { interRowCm: 20, intraRowCm: 10 },
    seedRate: { amountPerHa: 3, unit: 'kg_scarified_seed' },
    growthStages: [
      { id: 'scarification_sowing', name: 'Scarification & Emergence', order: 1, relativeStartDay: 0, relativeEndDay: 10, description: 'Hot-water treated seeds break dormancy; uniform sprouting.' },
      { id: 'foliage_growth', name: 'Vegetative Shoot Development', order: 2, relativeStartDay: 11, relativeEndDay: 25, description: 'Serrate tender leaf development; protect from flea beetles.' },
      { id: 'repeated_cuttings', name: 'Periodic Leaf Clipping', order: 3, relativeStartDay: 26, relativeEndDay: 65, description: 'Cut tender stems 5cm above ground; multi-cut harvest cycle.' },
    ],
    harvestIndicators: ['Tender stems 20-30cm high with bright green succulent leaves', 'Harvest before flowering occurs to preserve mucilage (draw) properties'],
    postHarvestRequirements: ['Bundle in wet jute sacks', 'Transport early morning to urban markets in Ibadan, Abeokuta, and Lagos'],
    varieties: [
      { id: 'oniyaya-broad', name: 'Oniyaya (Broad Leaf)', daysToMaturity: 30, expectedYieldTonnesPerHa: 18.0, description: 'High draw/viscosity leaf popular across Lagos, Oyo and Ogun.' },
      { id: 'amugbadu', name: 'Amugbadu', daysToMaturity: 35, expectedYieldTonnesPerHa: 16.0, description: 'Serrate leaf, highly disease tolerant and drought hardy.' },
    ],
  },
  {
    id: 'cucumber',
    commonName: 'Cucumber',
    scientificName: 'Cucumis sativus',
    localNames: { yo: 'Kókúmbà', pcm: 'Kukumba', ha: 'Gurji', ig: 'Kukumba' },
    category: 'vegetable',
    typicalDurationDays: 55,
    suitableZones: ['rainforest', 'derived_savanna'],
    spacing: { interRowCm: 100, intraRowCm: 50 },
    seedRate: { amountPerHa: 1.5, unit: 'kg_hybrid_seed' },
    growthStages: [
      { id: 'emergence_trellis', name: 'Emergence & Trellis Training', order: 1, relativeStartDay: 0, relativeEndDay: 20, description: 'Rapid germination; attach tendrils to bamboo trellis strings.' },
      { id: 'flowering_fruiting', name: 'Prolific Flowering & Fruit Expansion', order: 2, relativeStartDay: 21, relativeEndDay: 45, description: 'Gynoecious flowers open; rapid cylindrical fruit swelling.' },
      { id: 'continuous_picking', name: 'Frequent Fruit Harvesting', order: 3, relativeStartDay: 46, relativeEndDay: 70, description: 'Harvest cylindrical crisp fruits every 48 hours.' },
    ],
    harvestIndicators: ['Firm dark-green cylindrical fruit 18-22cm long', 'Blossom end completely rounded, not tapered', 'Seeds inside still soft and translucent'],
    postHarvestRequirements: ['Wash in clean chlorinated water dip', 'Pack in ventilated plastic crates; store at 12-14°C'],
    varieties: [
      { id: 'darina-f1', name: 'Darina F1', daysToMaturity: 50, expectedYieldTonnesPerHa: 30.0, description: 'Gynoecious hybrid, dark green straight fruits, downy mildew tolerant.' },
      { id: 'marketer', name: 'Marketer', daysToMaturity: 60, expectedYieldTonnesPerHa: 20.0, description: 'Standard open-pollinated field variety.' },
    ],
  },
  {
    id: 'watermelon',
    commonName: 'Watermelon',
    scientificName: 'Citrullus lanatus',
    localNames: { yo: 'Elégédé / Watermelon', pcm: 'Wotamelon', ha: 'Kankana', ig: 'Watermelon' },
    category: 'vegetable',
    typicalDurationDays: 80,
    suitableZones: ['derived_savanna', 'rainforest'],
    spacing: { interRowCm: 200, intraRowCm: 100 },
    seedRate: { amountPerHa: 2, unit: 'kg' },
    growthStages: [
      { id: 'emergence_run', name: 'Emergence & Vine Running', order: 1, relativeStartDay: 0, relativeEndDay: 25, description: 'Sprouting and horizontal crawling vine expansion across wide beds.' },
      { id: 'flowering_pollination', name: 'Flowering & Bee Pollination', order: 2, relativeStartDay: 26, relativeEndDay: 48, description: 'Morning blooming; avoid insecticide sprays to protect honeybees.' },
      { id: 'fruit_enlargement', name: 'Fruit Thinning & Sizing', order: 3, relativeStartDay: 49, relativeEndDay: 70, description: 'Prune down to 2-3 best melons per vine; place straw pads under fruit.' },
      { id: 'ripening_harvest', name: 'Maturity & Harvest', order: 4, relativeStartDay: 71, relativeEndDay: 90, description: 'Dull thud sound test upon tapping; cream-yellow ground spot.' },
    ],
    harvestIndicators: ['Tendril closest to fruit stem turns completely brown and dry', 'Ground belly spot turns from white to creamy rich yellow', 'Dull, hollow sound when tapped with knuckles'],
    postHarvestRequirements: ['Cut with 3cm stem intact (do not pull from vine)', 'Transport with straw bedding to prevent transit cracking'],
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
    localNames: { yo: 'Kòkó', pcm: 'Koko', ha: 'Koko', ig: 'Koko' },
    category: 'tree_crop',
    typicalDurationDays: 730,
    suitableZones: ['rainforest'],
    spacing: { interRowCm: 300, intraRowCm: 300 },
    seedRate: { amountPerHa: 1111, unit: 'seedlings' },
    growthStages: [
      { id: 'establishment', name: 'Nursery & Field Establishment', order: 1, relativeStartDay: 0, relativeEndDay: 365, description: 'Shade tree establishment and young tree development.' },
      { id: 'mature_bearing', name: 'Mature Pod Bearing & Maintenance', order: 2, relativeStartDay: 366, relativeEndDay: 730, description: 'Pruning, chupon removal, and black-pod disease spraying.' },
    ],
    harvestIndicators: ['Pods turn from green/purple to bright yellow or orange', 'Seeds rattle slightly inside ripe pod when shaken'],
    postHarvestRequirements: ['Pod breaking within 5 days of harvest', 'Fermentation in wooden sweatboxes for 6 days with banana leaf cover', 'Sun drying on raised wooden mats to 7% moisture'],
    varieties: [
      { id: 'crin-tc-series', name: 'CRIN TC Series (Amazon Hybrid)', daysToMaturity: 730, expectedYieldTonnesPerHa: 1.5, description: 'Early bearing, black-pod disease tolerant.' },
    ],
  },
  {
    id: 'oil_palm',
    commonName: 'Oil Palm (Phase 1.5)',
    scientificName: 'Elaeis guineensis',
    localNames: { yo: 'Ọ̀pẹ', pcm: 'Pam Tri', ha: 'Kwara', ig: 'Nkwụ' },
    category: 'tree_crop',
    typicalDurationDays: 1095,
    suitableZones: ['rainforest'],
    spacing: { interRowCm: 900, intraRowCm: 900 },
    seedRate: { amountPerHa: 143, unit: 'polybag_seedlings' },
    growthStages: [
      { id: 'nursery_immature', name: 'Nursery & Immature Field Stage', order: 1, relativeStartDay: 0, relativeEndDay: 730, description: 'Triangular spacing planting; cover cropping with Pueraria.' },
      { id: 'bearing', name: 'Commercial Bunch Bearing', order: 2, relativeStartDay: 731, relativeEndDay: 1095, description: 'Frond pruning and regular fresh fruit bunch (FFB) harvesting.' },
    ],
    harvestIndicators: ['At least 5 to 10 loose fruits drop naturally from bunch to the ground', 'Fruitlets turn bright reddish-orange'],
    postHarvestRequirements: ['Process bunches within 24-48 hours to prevent Free Fatty Acid (FFA) buildup above 5%'],
    varieties: [
      { id: 'nifor-tenera', name: 'NIFOR Tenera Hybrid', daysToMaturity: 1095, expectedYieldTonnesPerHa: 18.0, description: 'High oil extraction ratio, thin shell.' },
    ],
  },
  {
    id: 'cashew',
    commonName: 'Cashew (Phase 1.5)',
    scientificName: 'Anacardium occidentale',
    localNames: { yo: 'Káṣù', pcm: 'Kashu', ha: 'Kaju', ig: 'Kashu' },
    category: 'tree_crop',
    typicalDurationDays: 1095,
    suitableZones: ['derived_savanna', 'rainforest'],
    spacing: { interRowCm: 800, intraRowCm: 800 },
    seedRate: { amountPerHa: 156, unit: 'grafted_seedlings' },
    growthStages: [
      { id: 'juvenile', name: 'Juvenile Tree Establishment', order: 1, relativeStartDay: 0, relativeEndDay: 730, description: 'Graft training, weed clearing, fire-trace construction.' },
      { id: 'flowering_nutting', name: 'Flowering & Nut Fall', order: 2, relativeStartDay: 731, relativeEndDay: 1095, description: 'Panicle inflorescence and mature nut detachment.' },
    ],
    harvestIndicators: ['Cashew apples and attached nuts fall naturally to ground when fully ripe', 'Nut shell is dark grey and rock-hard'],
    postHarvestRequirements: ['Separate apple from nut immediately', 'Sun drying raw nuts on concrete floor for 2-3 days until moisture drops below 9%'],
    varieties: [
      { id: 'jumbo-nut', name: 'Jumbo Nut Selection', daysToMaturity: 1095, expectedYieldTonnesPerHa: 1.2, description: 'Large kernel export quality nuts.' },
    ],
  },
];

export function normalizeCrop(crop: CropDefinition): CropDefinition {
  return {
    ...crop,
    name: crop.name ?? crop.commonName,
    stages: crop.stages ?? crop.growthStages ?? [],
    varieties: crop.varieties.map((v) => ({
      ...v,
      typicalYieldTonsPerHa: v.typicalYieldTonsPerHa ?? v.expectedYieldTonnesPerHa,
    })),
  };
}

export const NORMALIZED_CROP_CATALOGUE: CropDefinition[] = CROP_CATALOGUE.map(normalizeCrop);

export function getCropById(cropId: string): CropDefinition | undefined {
  const crop = CROP_CATALOGUE.find((c) => c.id === cropId);
  return crop ? normalizeCrop(crop) : undefined;
}

export function getCropsByCategory(category: string): CropDefinition[] {
  return NORMALIZED_CROP_CATALOGUE.filter((c) => c.category === category);
}

export function getCropsByZone(zone: FarmZone): CropDefinition[] {
  return NORMALIZED_CROP_CATALOGUE.filter((c) => c.suitableZones.includes(zone));
}

export function getCropGrowthStages(cropId: string): GrowthStageDefinition[] {
  const crop = getCropById(cropId);
  return crop?.growthStages ?? crop?.stages ?? [];
}

/**
 * Calculates target plant population per hectare based on spacing dimensions.
 */
export function calculatePlantPopulation(interRowCm: number, intraRowCm: number, areaHa = 1.0): number {
  if (interRowCm <= 0 || intraRowCm <= 0 || areaHa <= 0) return 0;
  const areaSqM = areaHa * 10000;
  const plantAreaSqM = (interRowCm / 100) * (intraRowCm / 100);
  return Math.round(areaSqM / plantAreaSqM);
}
