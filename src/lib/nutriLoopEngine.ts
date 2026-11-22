import { isDietaryCompatible } from './matchingEngine';
import type { DonationBatch } from '../types/database';
import type {
  CommunityFoodInventoryRecord,
  CommunityGapAnalysis,
  CommunityNutritionProfile,
  FoodCompositionCategory,
  FoodCompositionItem,
  NutrientConfig,
  NutrientGapMetric,
  TargetedDonationRequest,
  TargetedRequestPriority,
} from '../types/nutriloop';

/**
 * Validated Default Core Nutrient Configurations sourced from:
 * ICMR-NIN (2020), "Nutrient Requirements for Indians — Recommended Dietary Allowances
 * and Estimated Average Requirements", National Institute of Nutrition, Hyderabad.
 */
export const DEFAULT_NUTRIENT_CONFIGS: NutrientConfig[] = [
  {
    id: 'nutr-calories',
    nutrient_key: 'calories_kcal',
    display_name: 'Calories (Energy)',
    unit: 'kcal',
    adult_daily_rda: 2110,
    priority_weight: 0.2,
    source_guideline: 'ICMR-NIN RDA 2020 (Sedentary Adult Ref)',
    is_core: true,
    is_enabled: true,
  },
  {
    id: 'nutr-protein',
    nutrient_key: 'protein_g',
    display_name: 'Protein',
    unit: 'g',
    adult_daily_rda: 50,
    priority_weight: 0.24,
    source_guideline: 'ICMR-NIN RDA 2020 (0.83g/kg ref)',
    is_core: true,
    is_enabled: true,
  },
  {
    id: 'nutr-iron',
    nutrient_key: 'iron_mg',
    display_name: 'Iron',
    unit: 'mg',
    adult_daily_rda: 19,
    priority_weight: 0.18,
    source_guideline: 'ICMR-NIN RDA 2020 (Adult Ref)',
    is_core: true,
    is_enabled: true,
  },
  {
    id: 'nutr-calcium',
    nutrient_key: 'calcium_mg',
    display_name: 'Calcium',
    unit: 'mg',
    adult_daily_rda: 1000,
    priority_weight: 0.14,
    source_guideline: 'ICMR-NIN RDA 2020',
    is_core: true,
    is_enabled: true,
  },
  {
    id: 'nutr-vita',
    nutrient_key: 'vitamin_a_mcg',
    display_name: 'Vitamin A (RAE)',
    unit: 'mcg',
    adult_daily_rda: 840,
    priority_weight: 0.12,
    source_guideline: 'ICMR-NIN RDA 2020',
    is_core: true,
    is_enabled: true,
  },
  {
    id: 'nutr-fibre',
    nutrient_key: 'dietary_fibre_g',
    display_name: 'Dietary Fibre',
    unit: 'g',
    adult_daily_rda: 30,
    priority_weight: 0.12,
    source_guideline: 'ICMR-NIN RDA 2020',
    is_core: true,
    is_enabled: true,
  },
];

/**
 * Validated Food Composition Dataset sourced from:
 * - ICMR-NIN Indian Food Composition Tables (IFCT 2017)
 * - FAO/INFOODS Food Composition Database for Biodiversity & Prepared Dishes
 *
 * Values represent edible cooked/ready-to-serve equivalents per 100g so portion
 * math matches real-world surplus food handovers accurately.
 */
export const VALIDATED_FOOD_COMPOSITION_TABLE: FoodCompositionItem[] = [
  {
    id: 'fc-cooked-rice',
    food_code: 'IFCT-A015-COOKED',
    food_name: 'Steamed Parboiled White Rice (Cooked)',
    food_category: 'CEREALS_GRAINS',
    dietary_type: 'VEGAN',
    standard_portion_grams: 250,
    calories_kcal_per_100g: 130,
    protein_g_per_100g: 2.7,
    iron_mg_per_100g: 0.35,
    calcium_mg_per_100g: 8.5,
    vitamin_a_mcg_per_100g: 0,
    dietary_fibre_g_per_100g: 0.9,
    extra_nutrients_per_100g: { vitamin_c_mg: 0, zinc_mg: 0.45 },
    source_dataset: 'ICMR-NIN IFCT 2017',
    source_reference: 'Code A015 (Rice, parboiled, milled — hydrated cooked yield 2.7x)',
    is_active: true,
  },
  {
    id: 'fc-sambar-sadam',
    food_code: 'IFCT-MIX-SAMBAR',
    food_name: 'Sambar Sadam & Vegetable Poriyal (Prepared)',
    food_category: 'MIXED_COOKED_MEAL',
    dietary_type: 'VEGETARIAN',
    standard_portion_grams: 300,
    calories_kcal_per_100g: 142,
    protein_g_per_100g: 4.8,
    iron_mg_per_100g: 1.45,
    calcium_mg_per_100g: 34,
    vitamin_a_mcg_per_100g: 62,
    dietary_fibre_g_per_100g: 2.9,
    extra_nutrients_per_100g: { vitamin_c_mg: 8.5, zinc_mg: 0.72 },
    source_dataset: 'ICMR-NIN IFCT 2017 / FAO-INFOODS',
    source_reference: 'Composite recipe from A015 Rice, B015 Red Gram Dal & Drumstick/Carrot',
    is_active: true,
  },
  {
    id: 'fc-toor-dal',
    food_code: 'IFCT-B015-COOKED',
    food_name: 'Red Gram (Toor) Dal Tadka (Cooked)',
    food_category: 'PULSES_LEGUMES',
    dietary_type: 'VEGAN',
    standard_portion_grams: 200,
    calories_kcal_per_100g: 124,
    protein_g_per_100g: 7.4,
    iron_mg_per_100g: 1.9,
    calcium_mg_per_100g: 28,
    vitamin_a_mcg_per_100g: 14,
    dietary_fibre_g_per_100g: 3.8,
    extra_nutrients_per_100g: { vitamin_c_mg: 2.0, zinc_mg: 1.1 },
    source_dataset: 'ICMR-NIN IFCT 2017',
    source_reference: 'Code B015 (Red gram, dal — cooked 1:2.8 yield)',
    is_active: true,
  },
  {
    id: 'fc-chana-masala',
    food_code: 'IFCT-B003-COOKED',
    food_name: 'Bengal Gram / Chickpea (Chana) Curry',
    food_category: 'PULSES_LEGUMES',
    dietary_type: 'VEGAN',
    standard_portion_grams: 200,
    calories_kcal_per_100g: 158,
    protein_g_per_100g: 8.6,
    iron_mg_per_100g: 2.9,
    calcium_mg_per_100g: 56,
    vitamin_a_mcg_per_100g: 18,
    dietary_fibre_g_per_100g: 6.4,
    extra_nutrients_per_100g: { vitamin_c_mg: 4.5, zinc_mg: 1.4 },
    source_dataset: 'ICMR-NIN IFCT 2017',
    source_reference: 'Code B003 (Bengal gram, whole — cooked curry preparation)',
    is_active: true,
  },
  {
    id: 'fc-soya-chunks',
    food_code: 'IFCT-B018-COOKED',
    food_name: 'Soya Chunks Protein Curry (Cooked)',
    food_category: 'PULSES_LEGUMES',
    dietary_type: 'VEGAN',
    standard_portion_grams: 180,
    calories_kcal_per_100g: 152,
    protein_g_per_100g: 16.5,
    iron_mg_per_100g: 3.6,
    calcium_mg_per_100g: 112,
    vitamin_a_mcg_per_100g: 12,
    dietary_fibre_g_per_100g: 4.9,
    extra_nutrients_per_100g: { vitamin_c_mg: 2.5, zinc_mg: 1.8 },
    source_dataset: 'ICMR-NIN IFCT 2017',
    source_reference: 'Code B018 (Soya bean, hydrated defatted soya chunks curry)',
    is_active: true,
  },
  {
    id: 'fc-paneer-curry',
    food_code: 'IFCT-L004-COOKED',
    food_name: 'Paneer & Green Peas Masala',
    food_category: 'DAIRY_PROTEIN',
    dietary_type: 'VEGETARIAN',
    standard_portion_grams: 180,
    calories_kcal_per_100g: 215,
    protein_g_per_100g: 11.8,
    iron_mg_per_100g: 0.9,
    calcium_mg_per_100g: 245,
    vitamin_a_mcg_per_100g: 85,
    dietary_fibre_g_per_100g: 2.1,
    extra_nutrients_per_100g: { vitamin_c_mg: 6.0, zinc_mg: 1.5 },
    source_dataset: 'ICMR-NIN IFCT 2017',
    source_reference: 'Code L004 (Paneer, cow milk) + Code D058 (Green peas)',
    is_active: true,
  },
  {
    id: 'fc-keerai-poriyal',
    food_code: 'IFCT-C001-COOKED',
    food_name: 'Amaranth & Drumstick Leaves (Keerai) Stir-Fry',
    food_category: 'LEAFY_VEGETABLES',
    dietary_type: 'VEGAN',
    standard_portion_grams: 150,
    calories_kcal_per_100g: 68,
    protein_g_per_100g: 4.1,
    iron_mg_per_100g: 4.2,
    calcium_mg_per_100g: 218,
    vitamin_a_mcg_per_100g: 485,
    dietary_fibre_g_per_100g: 4.6,
    extra_nutrients_per_100g: { vitamin_c_mg: 38.0, zinc_mg: 0.68 },
    source_dataset: 'ICMR-NIN IFCT 2017',
    source_reference: 'Code C001 (Amaranth leaves) & Code C017 (Drumstick leaves, cooked)',
    is_active: true,
  },
  {
    id: 'fc-ragi-mudde',
    food_code: 'IFCT-A009-COOKED',
    food_name: 'Finger Millet (Ragi) Porridge / Mudde',
    food_category: 'CEREALS_GRAINS',
    dietary_type: 'VEGAN',
    standard_portion_grams: 220,
    calories_kcal_per_100g: 128,
    protein_g_per_100g: 3.1,
    iron_mg_per_100g: 1.9,
    calcium_mg_per_100g: 148,
    vitamin_a_mcg_per_100g: 4,
    dietary_fibre_g_per_100g: 4.8,
    extra_nutrients_per_100g: { vitamin_c_mg: 0, zinc_mg: 0.9 },
    source_dataset: 'ICMR-NIN IFCT 2017',
    source_reference: 'Code A009 (Finger millet / Ragi — cooked yield)',
    is_active: true,
  },
  {
    id: 'fc-curd-milk',
    food_code: 'IFCT-L001-SERVE',
    food_name: 'Toned Milk / Plain Curd (Dahi)',
    food_category: 'DAIRY_PROTEIN',
    dietary_type: 'VEGETARIAN',
    standard_portion_grams: 200,
    calories_kcal_per_100g: 64,
    protein_g_per_100g: 3.4,
    iron_mg_per_100g: 0.15,
    calcium_mg_per_100g: 125,
    vitamin_a_mcg_per_100g: 46,
    dietary_fibre_g_per_100g: 0,
    extra_nutrients_per_100g: { vitamin_c_mg: 1.0, zinc_mg: 0.4 },
    source_dataset: 'ICMR-NIN IFCT 2017',
    source_reference: 'Code L001 (Milk, whole/toned cow milk & curd)',
    is_active: true,
  },
  {
    id: 'fc-boiled-eggs',
    food_code: 'IFCT-M001-BOILED',
    food_name: 'Boiled Hen Eggs (2 Eggs Portion)',
    food_category: 'EGG_MEAT_FISH',
    dietary_type: 'EGGETARIAN',
    standard_portion_grams: 100,
    calories_kcal_per_100g: 155,
    protein_g_per_100g: 13.3,
    iron_mg_per_100g: 1.82,
    calcium_mg_per_100g: 50,
    vitamin_a_mcg_per_100g: 198,
    dietary_fibre_g_per_100g: 0,
    extra_nutrients_per_100g: { vitamin_c_mg: 0, zinc_mg: 1.2 },
    source_dataset: 'ICMR-NIN IFCT 2017',
    source_reference: 'Code M001 (Egg, poultry, whole, boiled)',
    is_active: true,
  },
  {
    id: 'fc-carrot-pumpkin',
    food_code: 'IFCT-D018-COOKED',
    food_name: 'Carrot, Pumpkin & Sweet Potato Stew',
    food_category: 'FRUITS_VEGETABLES',
    dietary_type: 'VEGAN',
    standard_portion_grams: 180,
    calories_kcal_per_100g: 62,
    protein_g_per_100g: 1.3,
    iron_mg_per_100g: 0.7,
    calcium_mg_per_100g: 32,
    vitamin_a_mcg_per_100g: 420,
    dietary_fibre_g_per_100g: 3.4,
    extra_nutrients_per_100g: { vitamin_c_mg: 14.0, zinc_mg: 0.3 },
    source_dataset: 'ICMR-NIN IFCT 2017 / FAO-INFOODS',
    source_reference: 'Code D018 (Carrot orange) & Code D065 (Pumpkin orange)',
    is_active: true,
  },
  {
    id: 'fc-groundnut-sundal',
    food_code: 'IFCT-G008-COOKED',
    food_name: 'Boiled Groundnut & Green Gram Sundal',
    food_category: 'NUTS_SEEDS',
    dietary_type: 'VEGAN',
    standard_portion_grams: 120,
    calories_kcal_per_100g: 238,
    protein_g_per_100g: 12.1,
    iron_mg_per_100g: 2.6,
    calcium_mg_per_100g: 52,
    vitamin_a_mcg_per_100g: 6,
    dietary_fibre_g_per_100g: 6.2,
    extra_nutrients_per_100g: { vitamin_c_mg: 1.5, zinc_mg: 1.9 },
    source_dataset: 'ICMR-NIN IFCT 2017',
    source_reference: 'Code G008 (Groundnut) + Code B009 (Green gram whole)',
    is_active: true,
  },
];

/**
 * ICMR-NIN (2020) Demographic Multipliers relative to sedentary adult reference RDA.
 * Accounts for age groups and physiological needs (children, adolescents, pregnant/lactating, elderly).
 */
const DEMOGRAPHIC_MULTIPLIERS: Record<
  'children_1_9' | 'adolescents_10_18' | 'adults_19_59' | 'pregnant_lactating' | 'elderly_60_plus',
  Record<string, number>
> = {
  children_1_9: {
    calories_kcal: 0.65,
    protein_g: 0.45,
    iron_mg: 0.65,
    calcium_mg: 0.6,
    vitamin_a_mcg: 0.6,
    dietary_fibre_g: 0.65,
    default: 0.6,
  },
  adolescents_10_18: {
    calories_kcal: 1.15,
    protein_g: 0.92,
    iron_mg: 1.25,
    calcium_mg: 1.0,
    vitamin_a_mcg: 1.0,
    dietary_fibre_g: 1.05,
    default: 1.05,
  },
  adults_19_59: {
    calories_kcal: 1.0,
    protein_g: 1.0,
    iron_mg: 1.0,
    calcium_mg: 1.0,
    vitamin_a_mcg: 1.0,
    dietary_fibre_g: 1.0,
    default: 1.0,
  },
  pregnant_lactating: {
    calories_kcal: 1.22,
    protein_g: 1.38,
    iron_mg: 1.42,
    calcium_mg: 1.2,
    vitamin_a_mcg: 1.1,
    dietary_fibre_g: 1.1,
    default: 1.25,
  },
  elderly_60_plus: {
    calories_kcal: 0.86,
    protein_g: 1.04,
    iron_mg: 0.95,
    calcium_mg: 1.15,
    vitamin_a_mcg: 0.95,
    dietary_fibre_g: 0.95,
    default: 0.95,
  },
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function getNutrientPer100g(item: FoodCompositionItem, nutrientKey: string): number {
  switch (nutrientKey) {
    case 'calories_kcal':
      return item.calories_kcal_per_100g;
    case 'protein_g':
      return item.protein_g_per_100g;
    case 'iron_mg':
      return item.iron_mg_per_100g;
    case 'calcium_mg':
      return item.calcium_mg_per_100g;
    case 'vitamin_a_mcg':
      return item.vitamin_a_mcg_per_100g;
    case 'dietary_fibre_g':
      return item.dietary_fibre_g_per_100g;
    default:
      return Number(item.extra_nutrients_per_100g?.[nutrientKey] ?? 0);
  }
}

/**
 * Resolves a FoodCompositionItem for a DonationBatch either by explicit food_composition_id
 * or via deterministic keyword matching against validated ICMR-NIN entries.
 * Returns null if food composition cannot be responsibly mapped (never fabricates data).
 */
export function resolveFoodCompositionForBatch(
  batch: Pick<DonationBatch, 'food_composition_id' | 'food_item' | 'dietary_type'>,
  catalog: FoodCompositionItem[]
): FoodCompositionItem | null {
  if (batch.food_composition_id) {
    const exact = catalog.find((c) => c.id === batch.food_composition_id && c.is_active);
    if (exact) return exact;
  }

  const text = batch.food_item.toLowerCase();
  const keywordMap: Array<{ terms: string[]; code: string }> = [
    { terms: ['soya', 'soy'], code: 'IFCT-B018-COOKED' },
    { terms: ['paneer', 'cottage cheese'], code: 'IFCT-L004-COOKED' },
    { terms: ['chana', 'chickpea', 'rajma', 'sundal'], code: 'IFCT-B003-COOKED' },
    { terms: ['dal', 'lentil', 'toor', 'moong', 'sambar'], code: 'IFCT-MIX-SAMBAR' },
    { terms: ['keerai', 'spinach', 'amaranth', 'drumstick', 'greens', 'palak'], code: 'IFCT-C001-COOKED' },
    { terms: ['ragi', 'millet'], code: 'IFCT-A009-COOKED' },
    { terms: ['milk', 'curd', 'dahi', 'buttermilk'], code: 'IFCT-L001-SERVE' },
    { terms: ['egg'], code: 'IFCT-M001-BOILED' },
    { terms: ['carrot', 'pumpkin', 'sweet potato'], code: 'IFCT-D018-COOKED' },
    { terms: ['groundnut', 'peanut'], code: 'IFCT-G008-COOKED' },
    { terms: ['rice', 'pulao', 'biryani', 'sadam'], code: 'IFCT-A015-COOKED' },
  ];

  for (const entry of keywordMap) {
    if (entry.terms.some((t) => text.includes(t))) {
      const matched = catalog.find((c) => c.food_code === entry.code && c.is_active);
      if (matched) return matched;
    }
  }

  return null;
}

/**
 * Estimates nutrient totals contributed by a given number of portions of a validated food item.
 */
export function estimateNutrientsForPortions(
  item: FoodCompositionItem,
  portions: number,
  nutrientConfigs: NutrientConfig[],
  customPortionGrams?: number
): Record<string, number> {
  if (!Number.isFinite(portions) || portions <= 0) {
    return Object.fromEntries(nutrientConfigs.map((n) => [n.nutrient_key, 0]));
  }
  const gramsPerPortion =
    customPortionGrams && customPortionGrams > 0
      ? customPortionGrams
      : item.standard_portion_grams;
  const totalGrams = portions * gramsPerPortion;
  const factor = totalGrams / 100;

  const result: Record<string, number> = {};
  for (const cfg of nutrientConfigs) {
    if (!cfg.is_enabled) continue;
    result[cfg.nutrient_key] = round2(getNutrientPer100g(item, cfg.nutrient_key) * factor);
  }
  return result;
}

/**
 * Calculates demographic-adjusted nutritional requirements R(j) for a recipient community
 * over its planning horizon (days).
 */
export function calculateCommunityRequirements(
  profile: CommunityNutritionProfile,
  nutrientConfigs: NutrientConfig[]
): { totalBeneficiaries: number; requirements: Record<string, number> } {
  const totalBeneficiaries =
    profile.children_1_9_count +
    profile.adolescents_10_18_count +
    profile.adults_19_59_count +
    profile.pregnant_lactating_count +
    profile.elderly_60_plus_count;

  const days = Math.max(1, profile.planning_horizon_days || 1);
  const requirements: Record<string, number> = {};

  for (const cfg of nutrientConfigs) {
    if (!cfg.is_enabled) continue;
    const mult = (group: keyof typeof DEMOGRAPHIC_MULTIPLIERS) =>
      DEMOGRAPHIC_MULTIPLIERS[group][cfg.nutrient_key] ?? DEMOGRAPHIC_MULTIPLIERS[group].default;

    const dailyTotal =
      cfg.adult_daily_rda *
      (profile.children_1_9_count * mult('children_1_9') +
        profile.adolescents_10_18_count * mult('adolescents_10_18') +
        profile.adults_19_59_count * mult('adults_19_59') +
        profile.pregnant_lactating_count * mult('pregnant_lactating') +
        profile.elderly_60_plus_count * mult('elderly_60_plus'));

    requirements[cfg.nutrient_key] = round2(dailyTotal * days);
  }

  return { totalBeneficiaries, requirements };
}

/**
 * Core Nutritional Gap Analysis Engine:
 *   G(j) = max(0, R(j) - A(j))
 *
 * Strictly separates Food Available, Food Distributed, Food Reported as Consumed,
 * and Estimated Nutritional Adequacy.
 */
export function analyzeCommunityNutritionalGaps(params: {
  profile: CommunityNutritionProfile;
  inventory: CommunityFoodInventoryRecord[];
  foodCatalog: FoodCompositionItem[];
  nutrientConfigs: NutrientConfig[];
}): CommunityGapAnalysis {
  const { profile, inventory, foodCatalog, nutrientConfigs } = params;
  const enabledNutrients = nutrientConfigs.filter((n) => n.is_enabled);
  const { totalBeneficiaries, requirements } = calculateCommunityRequirements(
    profile,
    enabledNutrients
  );

  const orgInventory = inventory.filter((rec) => rec.org_id === profile.org_id);

  const availableTotals: Record<string, number> = {};
  const distributedTotals: Record<string, number> = {};
  const consumedTotals: Record<string, number> = {};

  for (const cfg of enabledNutrients) {
    availableTotals[cfg.nutrient_key] = 0;
    distributedTotals[cfg.nutrient_key] = 0;
    consumedTotals[cfg.nutrient_key] = 0;
  }

  let totalPortionsAvailable = 0;
  let totalPortionsDistributed = 0;
  let totalPortionsConsumed = 0;
  let unmappedCount = 0;

  for (const rec of orgInventory) {
    if (rec.quantity_portions <= 0) continue;

    if (rec.inventory_stage === 'AVAILABLE') totalPortionsAvailable += rec.quantity_portions;
    else if (rec.inventory_stage === 'DISTRIBUTED') totalPortionsDistributed += rec.quantity_portions;
    else if (rec.inventory_stage === 'REPORTED_CONSUMED') totalPortionsConsumed += rec.quantity_portions;

    const comp = rec.food_composition_id
      ? foodCatalog.find((c) => c.id === rec.food_composition_id)
      : null;

    if (!comp) {
      unmappedCount += 1;
      continue;
    }

    const contrib = estimateNutrientsForPortions(
      comp,
      rec.quantity_portions,
      enabledNutrients,
      rec.portion_grams
    );

    for (const cfg of enabledNutrients) {
      const val = contrib[cfg.nutrient_key] ?? 0;
      if (rec.inventory_stage === 'AVAILABLE') {
        availableTotals[cfg.nutrient_key] += val;
      } else if (rec.inventory_stage === 'DISTRIBUTED') {
        distributedTotals[cfg.nutrient_key] += val;
      } else if (rec.inventory_stage === 'REPORTED_CONSUMED') {
        consumedTotals[cfg.nutrient_key] += val;
      }
    }
  }

  const nutrients: NutrientGapMetric[] = enabledNutrients.map((cfg) => {
    const req = requirements[cfg.nutrient_key] ?? 0;
    // Available pool for gap analysis includes AVAILABLE + DISTRIBUTED inventory (not yet lost)
    const availOnly = round2(availableTotals[cfg.nutrient_key] ?? 0);
    const distOnly = round2(distributedTotals[cfg.nutrient_key] ?? 0);
    const consOnly = round2(consumedTotals[cfg.nutrient_key] ?? 0);
    const effectiveSupply = round2(availOnly + distOnly);
    const gap = round2(Math.max(0, req - effectiveSupply));
    const adequacyPct = req > 0 ? round2(Math.min(100, (effectiveSupply / req) * 100)) : 100;
    const deficitRatio = req > 0 ? round2(Math.min(1, gap / req)) : 0;

    return {
      nutrient_key: cfg.nutrient_key,
      display_name: cfg.display_name,
      unit: cfg.unit,
      requirement: req,
      available: availOnly,
      distributed: distOnly,
      reported_consumed: consOnly,
      gap,
      adequacy_pct: adequacyPct,
      deficit_ratio: deficitRatio,
      priority_weight: cfg.priority_weight,
    };
  });

  // Weighted overall estimated nutritional adequacy
  const totalWeight = nutrients.reduce((s, n) => s + n.priority_weight, 0) || 1;
  const overallAdequacy = round2(
    nutrients.reduce((s, n) => s + n.adequacy_pct * n.priority_weight, 0) / totalWeight
  );

  // Rank highest-priority gaps by deficit_ratio * priority_weight
  const highestPriorityGaps = [...nutrients]
    .filter((n) => n.deficit_ratio >= 0.15 && n.gap > 0)
    .sort((a, b) => b.deficit_ratio * b.priority_weight - a.deficit_ratio * a.priority_weight);

  return {
    org_id: profile.org_id,
    total_beneficiaries: totalBeneficiaries,
    planning_horizon_days: profile.planning_horizon_days,
    total_portions_available: totalPortionsAvailable,
    total_portions_distributed: totalPortionsDistributed,
    total_portions_reported_consumed: totalPortionsConsumed,
    unmapped_inventory_count: unmappedCount,
    overall_adequacy_pct: overallAdequacy,
    nutrients,
    highest_priority_gaps: highestPriorityGaps,
  };
}

/**
 * Targeted Donation Request Generator.
 * Generates DRAFT_GENERATED requests targeting the community's highest nutritional gaps,
 * strictly respecting recipient dietary restrictions. Requests MUST be reviewed and
 * approved by an authorised NGO user before publishing to donors.
 */
export function generateTargetedDonationRequests(params: {
  analysis: CommunityGapAnalysis;
  profile: CommunityNutritionProfile;
  orgName: string;
  foodCatalog: FoodCompositionItem[];
  requiredDeliveryDateIso?: string;
  maxRequests?: number;
}): Array<Omit<TargetedDonationRequest, 'id' | 'created_at' | 'updated_at'>> {
  const {
    analysis,
    profile,
    orgName,
    foodCatalog,
    requiredDeliveryDateIso = new Date(Date.now() + 24 * 3_600_000).toISOString(),
    maxRequests = 3,
  } = params;

  const eligibleFoods = foodCatalog.filter(
    (item) => item.is_active && isDietaryCompatible(item.dietary_type, profile.dietary_restriction)
  );

  if (eligibleFoods.length === 0 || analysis.highest_priority_gaps.length === 0) {
    return [];
  }

  const drafts: Array<Omit<TargetedDonationRequest, 'id' | 'created_at' | 'updated_at'>> = [];

  for (const gapMetric of analysis.highest_priority_gaps.slice(0, maxRequests)) {
    // Rank compatible foods by nutrient density per standard portion
    const ranked = [...eligibleFoods]
      .map((item) => {
        const perPortion =
          (getNutrientPer100g(item, gapMetric.nutrient_key) * item.standard_portion_grams) / 100;
        return { item, perPortion };
      })
      .filter((entry) => entry.perPortion > 0)
      .sort((a, b) => b.perPortion - a.perPortion);

    if (ranked.length === 0) continue;

    const topFoods = ranked.slice(0, 3);
    const primary = topFoods[0];
    const recommendedCategory: FoodCompositionCategory = primary.item.food_category;

    // Bound requested portions sensibly by beneficiaries & planning horizon (never absurdly large)
    const rawPortionsNeeded = Math.ceil(gapMetric.gap / Math.max(primary.perPortion, 0.01));
    const maxPracticalPortions = Math.max(20, analysis.total_beneficiaries * analysis.planning_horizon_days * 2);
    const requestedPortions = Math.max(10, Math.min(rawPortionsNeeded, maxPracticalPortions));

    const priority: TargetedRequestPriority =
      gapMetric.deficit_ratio >= 0.5
        ? 'CRITICAL'
        : gapMetric.deficit_ratio >= 0.3
        ? 'HIGH'
        : 'MODERATE';

    const reasonSummary = `${orgName} has an estimated ${gapMetric.display_name.toLowerCase()} availability gap of ${gapMetric.gap.toLocaleString()} ${gapMetric.unit} (${Math.round(
      gapMetric.deficit_ratio * 100
    )}% below ${profile.planning_horizon_days}-day reference requirement for ${
      analysis.total_beneficiaries
    } beneficiaries).`;

    drafts.push({
      org_id: profile.org_id,
      target_nutrient_key: gapMetric.nutrient_key,
      target_nutrient_label: gapMetric.display_name,
      gap_amount: gapMetric.gap,
      gap_unit: gapMetric.unit,
      recommended_food_category: recommendedCategory,
      recommended_items: topFoods.map((f) => f.item.food_name),
      requested_portions: requestedPortions,
      priority_level: priority,
      reason_summary: reasonSummary,
      dietary_pref: profile.dietary_restriction,
      required_delivery_date: requiredDeliveryDateIso,
      status: 'DRAFT_GENERATED',
      approved_by: null,
      approved_at: null,
      linked_meal_request_id: null,
      matched_batch_id: null,
      is_demo: profile.is_demo,
    });
  }

  return drafts;
}

/**
 * Calculates deterministic Nutritional Gap Contribution Score N in [0, 1] for a candidate
 * donation batch matched against a recipient community's active nutritional gap analysis.
 * Returns transparent per-nutrient closure percentages — never an opaque black-box score.
 */
export function evaluateBatchNutritionalContribution(params: {
  batch: Pick<DonationBatch, 'food_composition_id' | 'food_item' | 'dietary_type'>;
  portionsToDeliver: number;
  communityAnalysis: CommunityGapAnalysis;
  foodCatalog: FoodCompositionItem[];
  nutrientConfigs: NutrientConfig[];
}): {
  scoreN: number;
  compositionName: string | null;
  sourceCitation: string | null;
  addressedGaps: Array<{ nutrient: string; closurePct: number; addedAmount: number; unit: string }>;
  explanation: string;
} {
  const { batch, portionsToDeliver, communityAnalysis, foodCatalog, nutrientConfigs } = params;
  const comp = resolveFoodCompositionForBatch(batch, foodCatalog);

  if (!comp) {
    return {
      scoreN: 0,
      compositionName: null,
      sourceCitation: null,
      addressedGaps: [],
      explanation: 'Food item is not mapped to a validated composition table; nutritional score defaults to 0 (no fabricated estimates).',
    };
  }

  const activeGaps = communityAnalysis.nutrients.filter((n) => n.gap > 0);
  if (activeGaps.length === 0) {
    return {
      scoreN: 0.25,
      compositionName: comp.food_name,
      sourceCitation: comp.source_dataset,
      addressedGaps: [],
      explanation: `Mapped to ${comp.food_name} (${comp.source_dataset}); community currently meets baseline reference thresholds.`,
    };
  }

  const contrib = estimateNutrientsForPortions(comp, portionsToDeliver, nutrientConfigs);
  let weightedSum = 0;
  let weightDenominator = 0;
  const addressedGaps: Array<{ nutrient: string; closurePct: number; addedAmount: number; unit: string }> = [];

  for (const gapMetric of activeGaps) {
    const added = contrib[gapMetric.nutrient_key] ?? 0;
    const closureFraction = gapMetric.gap > 0 ? Math.min(1, added / gapMetric.gap) : 0;
    // Weight more heavily toward severe gaps (priority_weight * deficit_ratio)
    const importance = gapMetric.priority_weight * (0.5 + gapMetric.deficit_ratio);
    weightedSum += closureFraction * importance;
    weightDenominator += importance;

    if (closureFraction >= 0.05) {
      addressedGaps.push({
        nutrient: gapMetric.display_name,
        closurePct: Math.round(closureFraction * 100),
        addedAmount: round2(added),
        unit: gapMetric.unit,
      });
    }
  }

  addressedGaps.sort((a, b) => b.closurePct - a.closurePct);
  const scoreN = weightDenominator > 0 ? Math.round((weightedSum / weightDenominator) * 10000) / 10000 : 0;
  const topHighlight = addressedGaps
    .slice(0, 2)
    .map((g) => `covers ~${g.closurePct}% of ${g.nutrient.toLowerCase()} gap (+${g.addedAmount} ${g.unit})`)
    .join(', ');

  return {
    scoreN: Math.max(0, Math.min(1, scoreN)),
    compositionName: comp.food_name,
    sourceCitation: comp.source_dataset,
    addressedGaps,
    explanation: topHighlight
      ? `${comp.food_name} (${comp.source_dataset}): ${topHighlight}.`
      : `${comp.food_name} (${comp.source_dataset}) provides limited closure for this community's primary gaps.`,
  };
}
