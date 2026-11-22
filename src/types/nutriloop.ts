import type { DietaryPreference, DietaryType } from './database';

export type CoreNutrientKey =
  | 'calories_kcal'
  | 'protein_g'
  | 'iron_mg'
  | 'calcium_mg'
  | 'vitamin_a_mcg'
  | 'dietary_fibre_g';

export type FoodCompositionCategory =
  | 'CEREALS_GRAINS'
  | 'PULSES_LEGUMES'
  | 'DAIRY_PROTEIN'
  | 'EGG_MEAT_FISH'
  | 'LEAFY_VEGETABLES'
  | 'FRUITS_VEGETABLES'
  | 'NUTS_SEEDS'
  | 'MIXED_COOKED_MEAL';

export type InventoryStage = 'AVAILABLE' | 'DISTRIBUTED' | 'REPORTED_CONSUMED';

export type TargetedRequestPriority = 'CRITICAL' | 'HIGH' | 'MODERATE';

export type TargetedRequestStatus =
  | 'DRAFT_GENERATED'
  | 'APPROVED_PUBLISHED'
  | 'MATCHED'
  | 'FULFILLED'
  | 'DISMISSED';

export interface NutrientConfig {
  id: string;
  nutrient_key: string;
  display_name: string;
  unit: string;
  adult_daily_rda: number;
  priority_weight: number;
  source_guideline: string;
  is_core: boolean;
  is_enabled: boolean;
}

export interface FoodCompositionItem {
  id: string;
  food_code: string;
  food_name: string;
  food_category: FoodCompositionCategory;
  dietary_type: DietaryType;
  standard_portion_grams: number;
  calories_kcal_per_100g: number;
  protein_g_per_100g: number;
  iron_mg_per_100g: number;
  calcium_mg_per_100g: number;
  vitamin_a_mcg_per_100g: number;
  dietary_fibre_g_per_100g: number;
  extra_nutrients_per_100g: Record<string, number>;
  source_dataset: string;
  source_reference: string;
  is_active: boolean;
}

export interface CommunityNutritionProfile {
  id: string;
  org_id: string;
  children_1_9_count: number;
  adolescents_10_18_count: number;
  adults_19_59_count: number;
  pregnant_lactating_count: number;
  elderly_60_plus_count: number;
  dietary_restriction: DietaryPreference;
  planning_horizon_days: number;
  notes: string | null;
  is_demo: boolean;
  updated_at: string;
}

export interface CommunityFoodInventoryRecord {
  id: string;
  org_id: string;
  food_composition_id: string | null;
  custom_food_name: string;
  quantity_portions: number;
  portion_grams: number;
  inventory_stage: InventoryStage;
  source_batch_id: string | null;
  recorded_by: string | null;
  recorded_at: string;
  is_demo: boolean;
}

export interface TargetedDonationRequest {
  id: string;
  org_id: string;
  target_nutrient_key: string;
  target_nutrient_label: string;
  gap_amount: number;
  gap_unit: string;
  recommended_food_category: FoodCompositionCategory;
  recommended_items: string[];
  requested_portions: number;
  priority_level: TargetedRequestPriority;
  reason_summary: string;
  dietary_pref: DietaryPreference;
  required_delivery_date: string;
  status: TargetedRequestStatus;
  approved_by: string | null;
  approved_at: string | null;
  linked_meal_request_id: string | null;
  matched_batch_id: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface NutritionalImpactSnapshot {
  id: string;
  org_id: string;
  donation_batch_id: string | null;
  portions_confirmed: number;
  before_adequacy_pct: number;
  after_adequacy_pct: number;
  before_gaps: Record<string, number>;
  after_gaps: Record<string, number>;
  recorded_at: string;
  is_demo: boolean;
}

export interface NutrientGapMetric {
  nutrient_key: string;
  display_name: string;
  unit: string;
  requirement: number; // R(j)
  available: number; // A(j) from AVAILABLE inventory
  distributed: number; // Estimated nutrients in DISTRIBUTED stage
  reported_consumed: number; // Estimated nutrients in REPORTED_CONSUMED stage
  gap: number; // G(j) = max(0, R(j) - A(j))
  adequacy_pct: number; // min(100, (A(j) / R(j)) * 100)
  deficit_ratio: number; // G(j) / R(j) in [0, 1]
  priority_weight: number;
}

export interface CommunityGapAnalysis {
  org_id: string;
  total_beneficiaries: number;
  planning_horizon_days: number;
  total_portions_available: number;
  total_portions_distributed: number;
  total_portions_reported_consumed: number;
  unmapped_inventory_count: number;
  overall_adequacy_pct: number;
  nutrients: NutrientGapMetric[];
  highest_priority_gaps: NutrientGapMetric[];
}
